// Composant formulaire d'entraînement
class WorkoutFormComponent extends HTMLElement {
    constructor() {
        super();
        this.editingWorkout = null;
    }
    
    connectedCallback() {
        this.render();
        this.attachEventListeners();
    }
    
    render() {
        this.innerHTML = `
            <section>
                <h2>${this.editingWorkout ? 'Modifier' : 'Ajouter'} une séance d'entraînement</h2>
                <form id="workoutForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="workoutType">Type d'activité:</label>
                            <select id="workoutType" required>
                                <option value="">Sélectionner...</option>
                                <option value="musculation">Musculation</option>
                                <option value="cardio">Cardio</option>
                                <option value="yoga">Yoga</option>
                                <option value="natation">Natation</option>
                                <option value="course">Course</option>
                                <option value="vélo">Vélo</option>
                                <option value="marche">Marche</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="workoutDate">Date:</label>
                            <input type="datetime-local" id="workoutDate" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="workoutDuration">Durée (minutes):</label>
                            <input type="number" id="workoutDuration" min="1" max="600" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="workoutComment">Commentaire:</label>
                        <textarea id="workoutComment" placeholder="Notes sur votre séance..."></textarea>
                    </div>
                    
                    <div id="workoutFormError" class="alert alert-warning hidden"></div>
                    
                    <div style="display: flex; gap: 1rem;">
                        <button type="submit" class="btn-primary">
                            ${this.editingWorkout ? 'Modifier' : 'Ajouter'} la séance
                        </button>
                        ${this.editingWorkout ? '<button type="button" id="cancelEditBtn" class="btn-secondary">Annuler</button>' : ''}
                    </div>
                </form>
            </section>
        `;
        
        // Pré-remplir si en mode édition
        if (this.editingWorkout) {
            this.querySelector('#workoutType').value = this.editingWorkout.activity_type;
            this.querySelector('#workoutDate').value = this.formatDateTimeLocal(this.editingWorkout.date);
            this.querySelector('#workoutDuration').value = this.editingWorkout.duration_minutes;
            this.querySelector('#workoutComment').value = this.editingWorkout.comment || '';
        } else {
            // Date par défaut = maintenant
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            this.querySelector('#workoutDate').value = now.toISOString().slice(0, 16);
        }
    }
    
    formatDateTimeLocal(dateString) {
        const date = new Date(dateString);
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return date.toISOString().slice(0, 16);
    }
    
    attachEventListeners() {
        this.querySelector('#workoutForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit();
        });
        
        const cancelBtn = this.querySelector('#cancelEditBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.editingWorkout = null;
                this.render();
            });
        }
    }
    
    async handleSubmit() {
        const errorDiv = this.querySelector('#workoutFormError');
        errorDiv.classList.add('hidden');
        
        const activityType = this.querySelector('#workoutType').value;
        const date = this.querySelector('#workoutDate').value;
        const durationMinutes = parseInt(this.querySelector('#workoutDuration').value);
        const comment = this.querySelector('#workoutComment').value;
        
        if (!window.appState || !window.appState.getCurrentUser) {
            errorDiv.textContent = 'Application non initialisée. Rechargez la page.';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        const user = window.appState.getCurrentUser();
        if (!user) {
            errorDiv.textContent = 'Vous devez être connecté';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        // Calculer les calories
        const durationHours = durationMinutes / 60;
        const calories = window.appState.calculateCalories 
            ? window.appState.calculateCalories(activityType, durationHours)
            : 0;
        
        const workoutData = {
            user_id: user.id,
            activity_type: activityType,
            date: new Date(date).toISOString(),
            duration_minutes: durationMinutes,
            calories_burned: calories,
            comment: comment || null
        };
        
        try {
            if (this.editingWorkout) {
                // Mise à jour
                const { error } = await window.supabaseClient
                    .from('workouts')
                    .update(workoutData)
                    .eq('id', this.editingWorkout.id);
                
                if (error) throw error;
            } else {
                // Création
                const { error } = await window.supabaseClient
                    .from('workouts')
                    .insert(workoutData);
                
                if (error) throw error;
            }
            
            // Réinitialiser le formulaire
            this.editingWorkout = null;
            this.render();
            
            // Rafraîchir les autres composants
            this.dispatchEvent(new CustomEvent('workout-saved'));
            document.getElementById('workoutList').refresh();
            document.getElementById('dashboard').refresh();
            document.getElementById('goalsComponent').refresh();
            
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('hidden');
        }
    }
    
    editWorkout(workout) {
        this.editingWorkout = workout;
        this.render();
        // Scroller vers le formulaire
        this.scrollIntoView({ behavior: 'smooth' });
    }
}

customElements.define('workout-form-component', WorkoutFormComponent);

