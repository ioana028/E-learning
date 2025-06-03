import pandas as pd
import cx_Oracle
from joblib import load
import numpy as np
import sys
from sklearn.preprocessing import LabelEncoder

if len(sys.argv) < 2:
    print(" Trebuie sa specifici user_id. Ex: python predict_user_level.py 3")
    sys.exit(1)

user_id = int(sys.argv[1])

# Încarcă modelul și encoderii
model = load("ml/model.joblib")
le_diff = load("ml/le_diff.joblib")
le_level = load("ml/le_level.joblib")

# Conectare la Oracle
dsn = cx_Oracle.makedsn("localhost", 1521, service_name="orclpdb")
connection = cx_Oracle.connect(user="ioana", password="raduioanA123", dsn=dsn)

# Interogare pentru erori
query = """
SELECT difficulty, COUNT(*) as error_count
FROM user_errors
WHERE user_id = :user_id
GROUP BY difficulty
"""

df = pd.read_sql(query, con=connection, params={"user_id": user_id})
df.columns = df.columns.str.lower()

print(" Coloane returnate:", df.columns)
print(df)

# if df.empty:
#     print(f"ℹ️ Utilizatorul {user_id} nu are erori înregistrate.")
#     connection.close()
#     sys.exit(0)

if df.empty:
    print(f"Utilizatorul {user_id} nu are erori. Se verifica pentru posibila crestere de nivel...")

    # Obține nivelul actual din USERS
    cur = connection.cursor()
    cur.execute("SELECT english_level FROM users WHERE user_id = :id", {"id": user_id})
    current_level_row = cur.fetchone()

    if current_level_row:
        current_level = current_level_row[0]
        current_level = current_level.strip().upper()
        levels = ["A1", "A2", "B1", "B2", "C1", "C2"]
        if current_level in levels:
            current_index = levels.index(current_level)
            if current_index < len(levels) - 1:
                new_level = levels[current_index + 1]
                print(f" Nivel crescut: {current_level} -> {new_level}")
                
                cur.execute("UPDATE users SET english_level = :lvl WHERE user_id = :id", {
                    "lvl": new_level,
                    "id": user_id
                })
                connection.commit()
            else:
                print(" Utilizatorul este deja la nivelul maxim.")
        else:
            print(" Nivel necunoscut salvat in DB.")
    else:
        print(" Nu s a putut citi nivelul utilizatorului.")

    connection.close()
    sys.exit(0)


# Encode difficulty
def safe_encode(encoder, value):
    if value in encoder.classes_:
        return encoder.transform([value])[0]
    else:
        print(f" Difficulty necunoscuta: {value} — fallback -1")
        return -1

df['difficulty_encoded'] = df['difficulty'].apply(lambda x: safe_encode(le_diff, x))

# Pregătim inputul
X = df[['difficulty_encoded', 'error_count']]

# Prezicere
preds = model.predict(X)
pred_final = np.bincount(preds).argmax()
level_decoded = le_level.inverse_transform([pred_final])[0]

print(f" Nivel prezis pentru userul {user_id}: {level_decoded}")

# Update în USERS
update_cursor = connection.cursor()
update_cursor.execute("""
    UPDATE users SET english_level = :a WHERE user_id = :b
""", {"a": level_decoded, "b": user_id})

connection.commit()
print(" Nivel actualiza în tabela USERS.")
connection.close()
