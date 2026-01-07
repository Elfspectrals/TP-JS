// Composant liste des entraînements
class WorkoutListComponent extends HTMLElement {
    constructor() {
        super();
        this.workouts = [];
        this.filterCategory = null;
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
            this.workouts = [];
            this.render();
            return;
        }
        
        const user = window.appState.getCurrentUser();
        if (!user) {
            this.workouts = [];
            this.render();
            return;
        }
        
        let query = window.supabaseClient
            .from('workouts')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });
        
        if (this.filterCategory) {
            query = query.eq('activity_type', this.filterCategory);
        }
        
        const { data, error } = await query;
        
        if (error) {
            console.error('Erreur lors du chargement des entraînements:', error);
            return;
        }
        
        this.workouts = data || [];
        this.render();
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
        
        // Obtenir toutes les catégories uniques
        const categories = [...new Set(this.workouts.map(w => w.activity_type))];
        
        this.innerHTML = `
            <section>
                <h2>Historique des séances d'entraînement</h2>
                
                ${categories.length > 0 ? `
                    <div class="filters">
                        <button class="filter-btn ${!this.filterCategory ? 'active' : ''}" 
                                data-filter="all">
                            Toutes
                        </button>
                        ${categories.map(cat => `
                            <button class="filter-btn ${this.filterCategory === cat ? 'active' : ''}" 
                                    data-filter="${cat}">
                                ${this.formatCategory(cat)}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
                
                <div id="workoutItems">
                    ${this.workouts.length === 0 
                        ? '<p style="text-align: center; color: #6c757d; padding: 2rem;">Aucune séance enregistrée</p>'
                        : this.workouts.map(workout => this.renderWorkoutItem(workout)).join('')
                    }
                </div>
            </section>
        `;
        
        // Attacher les événements
        this.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filterCategory = filter === 'all' ? null : filter;
                this.refresh();
            });
        });
        
        this.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const workoutId = e.target.dataset.workoutId;
                const workout = this.workouts.find(w => w.id === workoutId);
                if (workout) {
                    document.getElementById('workoutForm').editWorkout(workout);
                }
            });
        });
        
        this.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const workoutId = e.target.dataset.workoutId;
                this.deleteWorkout(workoutId);
            });
        });
    }
    
    renderWorkoutItem(workout) {
        const date = new Date(workout.date);
        const formattedDate = date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="workout-item">
                <div class="workout-info">
                    <h3>${this.formatCategory(workout.activity_type)}</h3>
                    <div class="workout-meta">
                        <span>📅 ${formattedDate}</span>
                        <span>⏱️ ${workout.duration_minutes} min</span>
                        <span>🔥 ${workout.calories_burned || 0} kcal</span>
                    </div>
                    ${workout.comment ? `<p style="margin-top: 0.5rem; color: #6c757d;">${workout.comment}</p>` : ''}
                </div>
                <div class="workout-actions">
                    <button class="btn-primary btn-small edit-btn" data-workout-id="${workout.id}">
                        Modifier
                    </button>
                    <button class="btn-danger btn-small delete-btn" data-workout-id="${workout.id}">
                        Supprimer
                    </button>
                </div>
            </div>
        `;
    }
    
    formatCategory(category) {
        const categories = {
            'musculation': '💪 Musculation',
            'cardio': '❤️ Cardio',
            'yoga': '🧘 Yoga',
            'natation': '🏊 Natation',
            'course': '🏃 Course',
            'vélo': '🚴 Vélo',
            'marche': '🚶 Marche'
        };
        return categories[category] || category;
    }
    
    async deleteWorkout(workoutId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette séance ?')) {
            return;
        }
        
        const { error } = await window.supabaseClient
            .from('workouts')
            .delete()
            .eq('id', workoutId);
        
        if (error) {
            console.error('Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression');
        } else {
            this.refresh();
            document.getElementById('dashboard').refresh();
            document.getElementById('goalsComponent').refresh();
        }
    }
}

customElements.define('workout-list-component', WorkoutListComponent);

