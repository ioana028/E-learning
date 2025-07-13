import pandas as pd
import cx_Oracle
from joblib import load
import numpy as np
import sys
import json

sys.stdout.reconfigure(encoding='utf-8') 
from sklearn.preprocessing import LabelEncoder

# Verificăm dacă s-a dat user_id
if len(sys.argv) < 2:
    print("------------- Trebuie să specifici user_id. Ex: python predict_user_level.py 3")
    sys.exit(1)

user_id = int(sys.argv[1])
print(f"----------Pornim predicția pentru user_id: {user_id}")

# Încarcă modelul și encoderii
try:
    model = load("ml/model.joblib")
    le_diff = load("ml/le_diff.joblib")
    le_level = load("ml/le_level.joblib")
    print("------ Modelele și encoderii au fost încărcați.")
except Exception as e:
    print(f"-------------Eroare la încărcarea modelului/encoderilor: {e}")
    sys.exit(1)

# Conectare la Oracle
try:
    dsn = cx_Oracle.makedsn("localhost", 1521, service_name="orclpdb")
    connection = cx_Oracle.connect(user="ioana", password="raduioanA123", dsn=dsn)
    print("---------- Conectare la baza de date reușită.")
except Exception as e:
    print(f"---------- Eroare la conectarea la baza de date: {e}")
    sys.exit(1)

# 1. Obține JSON-ul cu ultimele lecții completate
cur = connection.cursor()
cur.execute("SELECT last_completed_lessons FROM users WHERE user_id = :id", {"id": user_id})
row = cur.fetchone()

if not row or not row[0]:
    print("---------- Utilizatorul nu are lecții completate.")
    connection.close()
    sys.exit(0)

lob_obj = row[0]
if hasattr(lob_obj, 'read'):
    completed_lessons_json = lob_obj.read()
else:
    completed_lessons_json = lob_obj

try:
    lessons_dict = json.loads(completed_lessons_json)

except json.JSONDecodeError as e:
    print(f"---------- Eroare la parsarea JSON-ului: {e}")
    connection.close()
    sys.exit(1)

# 2. Transformăm JSON-ul în perechi (chapter_id, lesson_number)
chapter_lesson_pairs = [(int(chap_id), int(lesson_nr)) for chap_id, lesson_nr in lessons_dict.items()]
print(f"---------- Perechi chapter/lesson extrase: {chapter_lesson_pairs}")

# 3. Obținem lesson_id-urile
lesson_ids = []
for chapter_id, lesson_number in chapter_lesson_pairs:
    cur.execute("""
        SELECT id FROM lessons
        WHERE chapter_id = :chapter AND lesson_number = :lesson
    """, {"chapter": chapter_id, "lesson": lesson_number})
    result = cur.fetchone()
    if result:
        lesson_ids.append(result[0])
        print(f"---------- Lecție găsită: chapter {chapter_id}, lecție {lesson_number} → lesson_id {result[0]}")
    else:
        print(f"---------- Lecție INEXISTENTĂ: chapter {chapter_id}, lecție {lesson_number}")

if not lesson_ids:
    print("---------- Niciun lesson_id valid găsit. Oprire.")
    connection.close()
    sys.exit(0)

# 4. Obținem greșelile din acele lecții
query = f"""
SELECT ue.difficulty, COUNT(*) as error_count
FROM user_errors ue
JOIN exercises ex ON ue.exercise_id = ex.id
WHERE ue.user_id = :user_id AND ex.lesson_id IN ({','.join([':l'+str(i) for i in range(len(lesson_ids))])})
GROUP BY ue.difficulty
"""

params = {"user_id": user_id}
for i, lid in enumerate(lesson_ids):
    params['l'+str(i)] = lid

df = pd.read_sql(query, con=connection, params=params)
df.columns = df.columns.str.lower()

print("---------- Rezultat greșeli pe dificultate:")
print(df)

if df.empty:
    print(f"---------- Utilizatorul {user_id} nu are greșeli în ultimele lecții. Se verifică posibilitatea de creștere nivel...")

    # Verificăm nivelul actual
    cur.execute("SELECT english_level FROM users WHERE user_id = :id", {"id": user_id})
    current_level_row = cur.fetchone()

    if current_level_row:
        current_level = current_level_row[0].strip().upper()
        print(f"---------- Nivel actual: {current_level}")
        levels = ["A1", "A2", "B1", "B2", "C1", "C2"]
        if current_level in levels:
            current_index = levels.index(current_level)
            if current_index < len(levels) - 1:
                new_level = levels[current_index + 1]
                print(f"---------- Creștere de nivel: {current_level} → {new_level}")
                cur.execute("UPDATE users SET english_level = :lvl WHERE user_id = :id", {
                    "lvl": new_level,
                    "id": user_id
                })
                connection.commit()
            else:
                print("---------- Utilizatorul este deja la nivelul maxim.")
        else:
            print("---------- Nivel necunoscut în baza de date.")
    else:
        print("---------- Nu s-a putut obține nivelul utilizatorului.")
    connection.close()
    sys.exit(0)

# 5. Encode difficulty
def safe_encode(encoder, value):
    if value in encoder.classes_:
        return encoder.transform([value])[0]
    else:
        print(f"---------- Difficulty necunoscută: {value} → fallback -1")
        return -1

df['difficulty_encoded'] = df['difficulty'].apply(lambda x: safe_encode(le_diff, x))

# 6. Pregătim inputul pentru predicție
X = df[['difficulty_encoded', 'error_count']]
print(f"---------- Input model:\n{X}")

# 7. Prezicere
try:
    preds = model.predict(X)
    pred_final = np.bincount(preds).argmax()
    level_decoded = le_level.inverse_transform([pred_final])[0]
    print(f"---------- Nivel prezis: {level_decoded}")
except Exception as e:
    print(f"---------- Eroare la predicție: {e}")
    connection.close()
    sys.exit(1)

# 8. Update în USERS
try:
    update_cursor = connection.cursor()
    update_cursor.execute("""
        UPDATE users SET english_level = :a WHERE user_id = :b
    """, {"a": level_decoded, "b": user_id})
    connection.commit()
    print("---------- Nivel actualizat în tabela USERS.")
except Exception as e:
    print(f"---------- Eroare la update în USERS: {e}")

connection.close()
print("---------- Conexiune închisă.")
