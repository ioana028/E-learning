import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import LabelEncoder
from joblib import dump

# Încarcă fișierul CSV
df = pd.read_csv("ml/Dataset_simplificat_pentru_model_ML.csv")
#D:\licenta\e-learning site\backend\ml\Dataset_simplificat_pentru_model_ML.csv
# Encodează valorile
le_diff = LabelEncoder()
le_level = LabelEncoder()

df['difficulty_encoded'] = le_diff.fit_transform(df['difficulty'])
df['level_encoded'] = le_level.fit_transform(df['level'])

# Definește X (features) și y (target)
X = df[['difficulty_encoded', 'error_count']]
y = df['level_encoded']

# Antrenează modelul
model = DecisionTreeClassifier()
model.fit(X, y)

# Salvează modelul și encoderii
dump(model, "ml/model.joblib")
dump(le_diff, "ml/le_diff.joblib")
dump(le_level, "ml/le_level.joblib")

print("✅ Model antrenat și salvat cu succes.")

# python ml/train_model.py
# python ml/predict_user_level.py 3

