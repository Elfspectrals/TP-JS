# Tableau de bord de suivi d'activité physique

Application web de suivi d'activité physique développée avec **Web Components**, **Supabase** et **Chart.js**.

## Fonctionnalités

### 🔐 Authentification
- Connexion avec email et mot de passe
- Inscription avec email et mot de passe

### 💪 Gestion des entraînements
- Ajout, modification et suppression de séances d'entraînement
- Catégorisation des activités (musculation, cardio, yoga, natation, course, vélo, marche)
- Historique complet des séances avec filtres par catégorie

### 📊 Tableau de bord
- **Camembert en temps réel** : Répartition des activités par catégorie (mis à jour automatiquement)
- **Graphiques de tendance** : 
  - Calories brûlées dans le temps
  - Temps d'entraînement dans le temps
- **Statistiques globales** : Total calories, temps et séances
- Calcul automatique des calories basé sur la formule MET

### 🎯 Objectifs
- Définition d'objectifs personnalisés :
  - Calories brûlées
  - Nombre de séances
  - Temps d'entraînement
- Périodes : hebdomadaire, mensuelle, annuelle
- Alertes automatiques si l'objectif n'est pas respecté (< 80% de progression)
- Barres de progression visuelles

### 👤 Profil utilisateur
- Gestion du poids, taille et âge
- Utilisé pour le calcul précis des calories brûlées

## Formule de calcul des calories

```
Calories = MET × poids (kg) × durée (heures)
```

**Valeurs MET par activité :**
- Musculation : 5
- Cardio : 10
- Yoga : 3
- Natation : 8
- Course : 9
- Vélo : 7
- Marche : 3.5

## Technologies utilisées

- **Web Components** : Architecture modulaire avec Custom Elements
- **Supabase** : Backend, authentification et base de données
- **Chart.js** : Graphiques interactifs (camembert, courbes)

## Installation

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd TP-JS
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration Supabase

1. Créer un projet sur [Supabase](https://supabase.com)
2. Récupérer l'URL et la clé anonyme de votre projet
3. Modifier le fichier `supabase-config.js` :

```javascript
const SUPABASE_URL = 'VOTRE_URL_SUPABASE';
const SUPABASE_ANON_KEY = 'VOTRE_CLE_ANON_SUPABASE';
```

### 4. Créer les tables dans Supabase

Exécutez ces requêtes SQL dans l'éditeur SQL de Supabase :

```sql
-- Table des profils utilisateurs
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  weight DECIMAL(5,2),
  height INTEGER,
  age INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des entraînements
CREATE TABLE workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  calories_burned INTEGER,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des objectifs
CREATE TABLE goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('calories', 'sessions', 'time')),
  target_value INTEGER NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('week', 'month', 'year')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Politiques de sécurité (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Politiques pour user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Politiques pour workouts
CREATE POLICY "Users can view own workouts" ON workouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts" ON workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts" ON workouts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts" ON workouts
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour goals
CREATE POLICY "Users can view own goals" ON goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON goals
  FOR DELETE USING (auth.uid() = user_id);
```

### 5. Lancer l'application

```bash
npm start
```

Ou utilisez un serveur local de votre choix (par exemple, avec Python : `python -m http.server 8000`)

Ouvrez votre navigateur à l'adresse indiquée (généralement `http://localhost:3000` ou `http://localhost:8000`)

## Structure du projet

```
TP-JS/
├── index.html              # Page principale
├── styles.css              # Styles globaux
├── main.js                 # Logique principale de l'application
├── supabase-config.js      # Configuration Supabase
├── package.json            # Dépendances
├── README.md              # Documentation
└── components/            # Web Components
    ├── auth-component.js      # Authentification
    ├── workout-form.js         # Formulaire d'entraînement
    ├── workout-list.js         # Liste des entraînements
    ├── dashboard.js            # Tableau de bord
    └── goals-component.js      # Gestion des objectifs
```

## Utilisation

1. **Inscription/Connexion** : Créez un compte ou connectez-vous
2. **Profil** : Renseignez votre poids, taille et âge pour des calculs précis
3. **Ajouter un entraînement** : Enregistrez vos séances avec type, durée, date et commentaire
4. **Visualiser** : Consultez vos statistiques et graphiques dans le tableau de bord
5. **Objectifs** : Définissez des objectifs et suivez votre progression

## Auteurs

Projet réalisé en binôme.

## Licence

MIT

