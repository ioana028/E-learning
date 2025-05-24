import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import LabelEncoder
from joblib import dump

# Citește fișierul
df = pd.read_csv("ml/training_dataset.csv")

# Encodează valorile categorice
le_topic = LabelEncoder()
le_diff = LabelEncoder()
le_level = LabelEncoder()

df['topic_encoded'] = le_topic.fit_transform(df['topic'])
df['difficulty_encoded'] = le_diff.fit_transform(df['difficulty'])
df['level_encoded'] = le_level.fit_transform(df['level'])

# Definește caracteristicile (features) și ținta (target)
X = df[['topic_encoded', 'difficulty_encoded', 'error_count']]
y = df['level_encoded']

# Antrenează modelul
model = DecisionTreeClassifier()
model.fit(X, y)

# Salvează modelul și encoderii
dump(model, "ml/model.joblib")
dump(le_topic, "ml/le_topic.joblib")
dump(le_diff, "ml/le_diff.joblib")
dump(le_level, "ml/le_level.joblib")

print("✅ Model antrenat și salvat cu succes.")
