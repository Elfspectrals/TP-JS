// Composant d'authentification
class AuthComponent extends HTMLElement {
    constructor() {
        super();
        this.currentTab = 'login';
    }
    
    connectedCallback() {
        this.render();
        this.attachEventListeners();
    }
    
    render() {
        this.innerHTML = `
            <div class="auth-container">
                <h2>🏋️ Suivi d'activité physique</h2>
                <div class="auth-tabs">
                    <button class="auth-tab active" data-tab="login">Connexion</button>
                    <button class="auth-tab" data-tab="signup">Inscription</button>
                </div>
                
                <form id="authForm">
                    <div class="form-group">
                        <label for="email">Email:</label>
                        <input type="email" id="email" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="password">Mot de passe:</label>
                        <input type="password" id="password" required minlength="6">
                    </div>
                    
                    <div id="authError" class="alert alert-warning hidden"></div>
                    
                    <button type="submit" class="btn-primary" style="width: 100%;">
                        ${this.currentTab === 'login' ? 'Se connecter' : "S'inscrire"}
                    </button>
                </form>
            </div>
        `;
    }
    
    attachEventListeners() {
        // Changement d'onglet
        this.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.currentTab = e.target.dataset.tab;
                this.updateTabs();
                this.querySelector('#authForm button[type="submit"]').textContent = 
                    this.currentTab === 'login' ? 'Se connecter' : "S'inscrire";
            });
        });
        
        // Soumission du formulaire
        this.querySelector('#authForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAuth();
        });
    }
    
    updateTabs() {
        this.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === this.currentTab);
        });
    }
    
    async handleAuth() {
        const email = this.querySelector('#email').value;
        const password = this.querySelector('#password').value;
        const errorDiv = this.querySelector('#authError');
        
        errorDiv.classList.add('hidden');
        
        // Vérifier que Supabase est disponible
        if (!window.supabaseClient) {
            // Essayer d'initialiser
            if (typeof supabase !== 'undefined') {
                const { initSupabase } = await import('../supabase-config.js');
                const client = initSupabase();
                if (!client) {
                    errorDiv.textContent = 'Erreur: Impossible de se connecter à Supabase. Vérifiez votre configuration.';
                    errorDiv.classList.remove('hidden');
                    return;
                }
            } else {
                errorDiv.textContent = 'Erreur: Supabase n\'est pas chargé. Vérifiez votre connexion internet.';
                errorDiv.classList.remove('hidden');
                return;
            }
        }
        
        try {
            if (this.currentTab === 'login') {
                const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });
                
                if (error) throw error;
            } else {
                const { data, error } = await window.supabaseClient.auth.signUp({
                    email,
                    password
                });
                
                if (error) throw error;
                
                alert('Inscription réussie! Vous pouvez maintenant vous connecter.');
                this.currentTab = 'login';
                this.updateTabs();
                this.querySelector('#authForm button[type="submit"]').textContent = 'Se connecter';
            }
        } catch (error) {
            console.error('Erreur d\'authentification:', error);
            
            // Messages d'erreur plus clairs
            let errorMessage = error.message || 'Une erreur est survenue.';
            
            if (error.message && error.message.includes('Failed to fetch')) {
                errorMessage = 'Impossible de se connecter à Supabase. Vérifiez:\n' +
                    '1. Que l\'URL Supabase est correcte dans supabase-config.js\n' +
                    '2. Que votre connexion internet fonctionne\n' +
                    '3. Que votre projet Supabase est actif';
            } else if (error.message && error.message.includes('ERR_NAME_NOT_RESOLVED')) {
                errorMessage = 'URL Supabase incorrecte. Vérifiez l\'URL dans supabase-config.js (format: https://[PROJECT_ID].supabase.co)';
            }
            
            errorDiv.textContent = errorMessage;
            errorDiv.classList.remove('hidden');
        }
    }
}

customElements.define('auth-component', AuthComponent);

