// Application principale
import { supabaseClient, initSupabase } from './supabase-config.js';

// MET values pour le calcul des calories
const MET_VALUES = {
    'musculation': 5,
    'cardio': 10,
    'yoga': 3,
    'natation': 8,
    'course': 9,
    'vélo': 7,
    'marche': 3.5
};

// État global de l'application
let currentUser = null;
let userProfile = null;

// Initialiser appState immédiatement pour que les composants puissent y accéder
window.appState = {
    getCurrentUser: () => currentUser,
    getUserProfile: () => userProfile,
    calculateCalories: (activityType, durationHours) => {
        if (!userProfile || !userProfile.weight) {
            return 0;
        }
        const met = MET_VALUES[activityType.toLowerCase()] || 5;
        return Math.round(met * userProfile.weight * durationHours);
    },
    MET_VALUES,
    supabaseClient: null // Sera mis à jour après initialisation
};

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    // S'assurer que Supabase est initialisé
    let client = window.supabaseClient || supabaseClient || initSupabase();
    if (!client) {
        console.error('Impossible d\'initialiser Supabase. Vérifiez votre configuration.');
        return;
    }
    
    // Mettre à jour appState avec le client Supabase
    window.appState.supabaseClient = client;
    
    // Vérifier si l'utilisateur est déjà connecté
    const { data: { session } } = await client.auth.getSession();
    
    if (session) {
        currentUser = session.user;
        await loadUserProfile();
        showMainApp();
    } else {
        showAuth();
    }
    
    // Écouter les changements d'authentification
    client.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
            currentUser = session.user;
            await loadUserProfile();
            showMainApp();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            userProfile = null;
            showAuth();
        }
    });
    
    // Bouton de déconnexion
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await client.auth.signOut();
    });
    
    // Sauvegarde du profil
    document.getElementById('saveProfileBtn').addEventListener('click', saveUserProfile);
    
    // Charger le profil si disponible
    if (currentUser) {
        await loadUserProfile();
    }
});

// Afficher l'authentification
function showAuth() {
    document.getElementById('authComponent').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

// Afficher l'application principale
function showMainApp() {
    document.getElementById('authComponent').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    // Notifier les composants que l'utilisateur est connecté
    document.getElementById('dashboard').refresh();
    document.getElementById('workoutList').refresh();
    document.getElementById('goalsComponent').refresh();
}

// Charger le profil utilisateur
async function loadUserProfile() {
    if (!currentUser) return;
    
    const client = window.supabaseClient || supabaseClient;
    if (!client) return;
    
    const { data, error } = await client
        .from('user_profiles')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Erreur lors du chargement du profil:', error);
        return;
    }
    
    if (data) {
        userProfile = data;
        document.getElementById('userWeight').value = data.weight || '';
        document.getElementById('userHeight').value = data.height || '';
        document.getElementById('userAge').value = data.age || '';
    }
}

// Sauvegarder le profil utilisateur
async function saveUserProfile() {
    if (!currentUser) return;
    
    const weight = parseFloat(document.getElementById('userWeight').value);
    const height = parseInt(document.getElementById('userHeight').value);
    const age = parseInt(document.getElementById('userAge').value);
    
    if (!weight || !height || !age) {
        alert('Veuillez remplir tous les champs du profil');
        return;
    }
    
    const profileData = {
        user_id: currentUser.id,
        weight,
        height,
        age,
        updated_at: new Date().toISOString()
    };
    
    const client = window.supabaseClient || supabaseClient;
    if (!client) {
        alert('Erreur: Supabase n\'est pas initialisé');
        return;
    }
    
    // Vérifier si le profil existe déjà
    const { data: existing } = await client
        .from('user_profiles')
        .select('id')
        .eq('user_id', currentUser.id)
        .single();
    
    let error;
    if (existing) {
        // Mettre à jour
        const { error: updateError } = await client
            .from('user_profiles')
            .update(profileData)
            .eq('user_id', currentUser.id);
        error = updateError;
    } else {
        // Créer
        const { error: insertError } = await client
            .from('user_profiles')
            .insert(profileData);
        error = insertError;
    }
    
    if (error) {
        console.error('Erreur lors de la sauvegarde du profil:', error);
        alert('Erreur lors de la sauvegarde du profil');
    } else {
        userProfile = profileData;
        alert('Profil enregistré avec succès!');
        // Rafraîchir le dashboard pour mettre à jour les calculs
        document.getElementById('dashboard').refresh();
    }
}

// Fonction utilitaire pour calculer les calories
function calculateCalories(activityType, durationHours) {
    if (!userProfile || !userProfile.weight) {
        return 0;
    }
    
    const met = MET_VALUES[activityType.toLowerCase()] || 5;
    return Math.round(met * userProfile.weight * durationHours);
}

// Mettre à jour appState avec les fonctions finales
window.appState.getCurrentUser = () => currentUser;
window.appState.getUserProfile = () => userProfile;
window.appState.calculateCalories = calculateCalories;
window.appState.MET_VALUES = MET_VALUES;
window.appState.supabaseClient = supabaseClient;

