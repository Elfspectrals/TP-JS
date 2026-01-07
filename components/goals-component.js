// Composant gestion des objectifs
class GoalsComponent extends HTMLElement {
    constructor() {
        super();
        this.goals = [];
        this.showForm = false;
    }
    
    connectedCallback() {
        this.render();
        this.refresh();
        
        // Écouter les événements de sauvegarde
        document.addEventListener('workout-saved', () => {
            this.refresh();
        });
    }
    
    async refresh() {
        if (!window.appState || !window.appState.getCurrentUser) {
            this.goals = [];
            this.render();
            return;
        }
        
        const user = window.appState.getCurrentUser();
        if (!user) {
            this.goals = [];
            this.render();
            return;
        }
        
        const { data, error } = await window.supabaseClient
            .from('goals')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Erreur lors du chargement des objectifs:', error);
            return;
        }
        
        this.goals = data || [];
        await this.calculateProgress();
        this.render();
    }
    
    async calculateProgress() {
        const user = window.appState.getCurrentUser();
        if (!user) return;
        
        // Charger les entraînements pour calculer les progrès
        const { data: workouts } = await window.supabaseClient
            .from('workouts')
            .select('*')
            .eq('user_id', user.id);
        
        if (!workouts) return;
        
        const now = new Date();
        
        for (const goal of this.goals) {
            let currentValue = 0;
            
            if (goal.goal_type === 'calories') {
                // Calories brûlées dans la période
                const startDate = this.getStartDate(goal.period);
                const relevantWorkouts = workouts.filter(w => 
                    new Date(w.date) >= startDate
                );
                currentValue = relevantWorkouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0);
            } else if (goal.goal_type === 'sessions') {
                // Nombre de séances dans la période
                const startDate = this.getStartDate(goal.period);
                const relevantWorkouts = workouts.filter(w => 
                    new Date(w.date) >= startDate
                );
                currentValue = relevantWorkouts.length;
            } else if (goal.goal_type === 'time') {
                // Temps d'entraînement dans la période
                const startDate = this.getStartDate(goal.period);
                const relevantWorkouts = workouts.filter(w => 
                    new Date(w.date) >= startDate
                );
                currentValue = relevantWorkouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);
            }
            
            goal.current_value = currentValue;
            goal.progress = Math.min((currentValue / goal.target_value) * 100, 100);
            goal.is_alert = currentValue < goal.target_value * 0.8; // Alerte si moins de 80%
        }
    }
    
    getStartDate(period) {
        const now = new Date();
        if (period === 'week') {
            const start = new Date(now);
            start.setDate(now.getDate() - now.getDay()); // Début de la semaine (dimanche)
            start.setHours(0, 0, 0, 0);
            return start;
        } else if (period === 'month') {
            return new Date(now.getFullYear(), now.getMonth(), 1);
        } else {
            return new Date(now.getFullYear(), 0, 1); // Début de l'année
        }
    }
    
    render() {
        if (!window.appState || !window.appState.getCurrentUser) {
            this.innerHTML = '';
            return;
        }
        
        const user = window.appState.getCurrentUser();
        if (!user) {
            this.innerHTML = '';
            return;
        }
        
        this.innerHTML = `
            <section>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="margin: 0;">🎯 Mes objectifs</h2>
                    <button class="btn-primary" id="addGoalBtn">
                        ${this.showForm ? 'Annuler' : '+ Ajouter un objectif'}
                    </button>
                </div>
                
                ${this.showForm ? this.renderGoalForm() : ''}
                
                <div id="goalsList">
                    ${this.goals.length === 0 
                        ? '<p style="text-align: center; color: #6c757d; padding: 2rem;">Aucun objectif défini</p>'
                        : this.goals.map(goal => this.renderGoalItem(goal)).join('')
                    }
                </div>
            </section>
        `;
        
        // Attacher les événements
        this.querySelector('#addGoalBtn')?.addEventListener('click', () => {
            this.showForm = !this.showForm;
            this.render();
        });
        
        if (this.showForm) {
            this.querySelector('#goalForm')?.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }
        
        this.querySelectorAll('.delete-goal-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const goalId = e.target.dataset.goalId;
                this.deleteGoal(goalId);
            });
        });
    }
    
    renderGoalForm() {
        return `
            <div style="background: var(--bg-color); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <form id="goalForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="goalType">Type d'objectif:</label>
                            <select id="goalType" required>
                                <option value="">Sélectionner...</option>
                                <option value="calories">Calories brûlées</option>
                                <option value="sessions">Nombre de séances</option>
                                <option value="time">Temps d'entraînement (minutes)</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="goalTarget">Valeur cible:</label>
                            <input type="number" id="goalTarget" min="1" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="goalPeriod">Période:</label>
                            <select id="goalPeriod" required>
                                <option value="week">Par semaine</option>
                                <option value="month">Par mois</option>
                                <option value="year">Par année</option>
                            </select>
                        </div>
                    </div>
                    
                    <button type="submit" class="btn-primary">Créer l'objectif</button>
                </form>
            </div>
        `;
    }
    
    renderGoalItem(goal) {
        const goalTypeLabels = {
            'calories': 'Calories brûlées',
            'sessions': 'Séances d\'entraînement',
            'time': 'Minutes d\'entraînement'
        };
        
        const periodLabels = {
            'week': 'par semaine',
            'month': 'par mois',
            'year': 'par année'
        };
        
        const alertClass = goal.is_alert ? 'alert' : '';
        
        return `
            <div class="goal-item ${alertClass}">
                <div class="goal-header">
                    <div>
                        <h3>${goalTypeLabels[goal.goal_type]} - ${periodLabels[goal.period]}</h3>
                        <p style="color: #6c757d; margin-top: 0.25rem;">
                            ${goal.current_value || 0} / ${goal.target_value} 
                            ${goal.goal_type === 'calories' ? 'kcal' : goal.goal_type === 'time' ? 'min' : ''}
                        </p>
                    </div>
                    <button class="btn-danger btn-small delete-goal-btn" data-goal-id="${goal.id}">
                        Supprimer
                    </button>
                </div>
                ${goal.is_alert ? `
                    <div class="alert alert-warning" style="margin-top: 1rem;">
                        ⚠️ Attention: Vous êtes en retard sur cet objectif!
                    </div>
                ` : ''}
                <div class="goal-progress">
                    <div class="goal-progress-bar" style="width: ${goal.progress || 0}%"></div>
                </div>
            </div>
        `;
    }
    
    async handleSubmit() {
        if (!window.appState || !window.appState.getCurrentUser) {
            alert('Application non initialisée. Rechargez la page.');
            return;
        }
        
        const user = window.appState.getCurrentUser();
        if (!user) return;
        
        const goalType = this.querySelector('#goalType').value;
        const targetValue = parseInt(this.querySelector('#goalTarget').value);
        const period = this.querySelector('#goalPeriod').value;
        
        const goalData = {
            user_id: user.id,
            goal_type: goalType,
            target_value: targetValue,
            period: period
        };
        
        const { error } = await window.supabaseClient
            .from('goals')
            .insert(goalData);
        
        if (error) {
            console.error('Erreur lors de la création de l\'objectif:', error);
            alert('Erreur lors de la création de l\'objectif');
        } else {
            this.showForm = false;
            this.refresh();
        }
    }
    
    async deleteGoal(goalId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) {
            return;
        }
        
        const { error } = await window.supabaseClient
            .from('goals')
            .delete()
            .eq('id', goalId);
        
        if (error) {
            console.error('Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression');
        } else {
            this.refresh();
        }
    }
}

customElements.define('goals-component', GoalsComponent);

