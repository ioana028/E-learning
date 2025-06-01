import pandas as pd
import cx_Oracle
from joblib import load
import numpy as np
import sys
from sklearn.preprocessing import LabelEncoder

# ✅ Primește user_id din linia de comandă
if len(sys.argv) < 2:
    print(" Trebuie să specifici user_id. Ex: python predict_user_level.py 3")
    sys.exit(1)

user_id = int(sys.argv[1])

# 🧠 Încarcă modelul și encoderii
model = load("ml/model.joblib")
le_topic = load("ml/le_topic.joblib")
le_diff = load("ml/le_diff.joblib")
le_level = load("ml/le_level.joblib")

# 🗄️ Conectare la Oracle
dsn = cx_Oracle.makedsn("localhost", 1521, service_name="orclpdb")
connection = cx_Oracle.connect(user="ioana", password="raduioanA123", dsn=dsn)

# 🔍 Selectează erorile grupate după topic + difficulty
query = """
SELECT topic, difficulty, COUNT(*) as error_count
FROM user_errors
WHERE user_id = :user_id
GROUP BY topic, difficulty
"""

df = pd.read_sql(query, con=connection, params={"user_id": user_id})
df.columns = df.columns.str.lower()  # 🔁 transformă coloanele în lowercase

print(" Coloane returnate:", df.columns)
print(df.head())

if df.empty:
    print(f" Utilizatorul {user_id} nu are erori înregistrate.")
    connection.close()
    sys.exit(0)

# 🔒 Funcție helper pentru encodare sigură
def safe_encode(encoder, value):
    if value in encoder.classes_:
        return encoder.transform([value])[0]
    else:
        print(f"⚠️ Valoare necunoscută: '{value}' — fallback -1")
        return -1

# ⬇️ Encodăm topic și difficulty în siguranță
df['topic_encoded'] = df['topic'].apply(lambda x: safe_encode(le_topic, x))
df['difficulty_encoded'] = df['difficulty'].apply(lambda x: safe_encode(le_diff, x))

# 🧪 Construim X pentru predicție
X = df[['topic_encoded', 'difficulty_encoded', 'error_count']]

# 🔮 Prezicere
preds = model.predict(X)
pred_final = np.bincount(preds).argmax()
level_decoded = le_level.inverse_transform([pred_final])[0]

print(f" Nivel prezis pentru userul {user_id}: {level_decoded}")

# 📝 Actualizează în tabela USERS
update_cursor = connection.cursor()
update_cursor.execute("""
    UPDATE users SET english_level = :a WHERE user_id = :b
""", {"a": level_decoded, "b": user_id})

connection.commit()
print(" Nivel actualizat în tabela USERS.")
connection.close()
