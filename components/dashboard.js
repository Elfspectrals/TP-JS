// Composant tableau de bord
class DashboardComponent extends HTMLElement {
    constructor() {
        super();
        this.pieChart = null;
        this.caloriesChart = null;
        this.timeChart = null;
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
            this.innerHTML = '';
            return;
        }
        
        const user = window.appState.getCurrentUser();
        if (!user) {
            this.innerHTML = '';
            return;
        }
        
        const { data: workouts, error } = await window.supabaseClient
            .from('workouts')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: true });
        
        if (error) {
            console.error('Erreur lors du chargement des données:', error);
            return;
        }
        
        this.workouts = workouts || [];
        this.updateCharts();
        this.updateStats();
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
                <h2>📊 Tableau de bord</h2>
                
                <div class="dashboard-grid">
                    <div class="stats-card">
                        <h3 id="totalCalories">0</h3>
                        <p>Calories brûlées (total)</p>
                    </div>
                    
                    <div class="stats-card">
                        <h3 id="totalTime">0</h3>
                        <p>Minutes d'entraînement (total)</p>
                    </div>
                    
                    <div class="stats-card">
                        <h3 id="totalWorkouts">0</h3>
                        <p>Séances d'entraînement</p>
                    </div>
                </div>
                
                <div class="chart-container">
                    <h3 style="margin-bottom: 1rem;">Répartition des activités</h3>
                    <canvas id="pieChart"></canvas>
                </div>
                
                <div class="dashboard-grid" style="margin-top: 2rem;">
                    <div class="chart-container">
                        <h3 style="margin-bottom: 1rem;">Calories brûlées dans le temps</h3>
                        <canvas id="caloriesChart"></canvas>
                    </div>
                    
                    <div class="chart-container">
                        <h3 style="margin-bottom: 1rem;">Temps d'entraînement dans le temps</h3>
                        <canvas id="timeChart"></canvas>
                    </div>
                </div>
            </section>
        `;
    }
    
    updateStats() {
        if (!this.workouts) return;
        
        const totalCalories = this.workouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0);
        const totalTime = this.workouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);
        const totalWorkouts = this.workouts.length;
        
        const totalCaloriesEl = this.querySelector('#totalCalories');
        const totalTimeEl = this.querySelector('#totalTime');
        const totalWorkoutsEl = this.querySelector('#totalWorkouts');
        
        if (totalCaloriesEl) totalCaloriesEl.textContent = totalCalories.toLocaleString();
        if (totalTimeEl) totalTimeEl.textContent = totalTime.toLocaleString();
        if (totalWorkoutsEl) totalWorkoutsEl.textContent = totalWorkouts;
    }
    
    updateCharts() {
        if (!this.workouts) return;
        
        // Détruire les graphiques existants
        if (this.pieChart) {
            this.pieChart.destroy();
        }
        if (this.caloriesChart) {
            this.caloriesChart.destroy();
        }
        if (this.timeChart) {
            this.timeChart.destroy();
        }
        
        // Graphique en camembert - Répartition par catégorie
        this.updatePieChart();
        
        // Graphiques de tendance - Calories et temps
        this.updateTrendCharts();
    }
    
    updatePieChart() {
        const pieCanvas = this.querySelector('#pieChart');
        if (!pieCanvas) return;
        
        // Compter les activités par catégorie
        const categoryCount = {};
        this.workouts.forEach(workout => {
            const category = workout.activity_type;
            categoryCount[category] = (categoryCount[category] || 0) + 1;
        });
        
        const categories = Object.keys(categoryCount);
        const counts = Object.values(categoryCount);
        
        // Couleurs pour chaque catégorie
        const colors = [
            '#4a90e2', '#50c878', '#e74c3c', '#f39c12',
            '#9b59b6', '#1abc9c', '#e67e22'
        ];
        
        this.pieChart = new Chart(pieCanvas, {
            type: 'pie',
            data: {
                labels: categories.map(cat => this.formatCategory(cat)),
                datasets: [{
                    data: counts,
                    backgroundColor: colors.slice(0, categories.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} séance(s) (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    updateTrendCharts() {
        // Grouper les données par date
        const dataByDate = {};
        this.workouts.forEach(workout => {
            const date = new Date(workout.date).toLocaleDateString('fr-FR');
            if (!dataByDate[date]) {
                dataByDate[date] = { calories: 0, time: 0 };
            }
            dataByDate[date].calories += workout.calories_burned || 0;
            dataByDate[date].time += workout.duration_minutes || 0;
        });
        
        const dates = Object.keys(dataByDate).sort((a, b) => {
            return new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-'));
        });
        
        const caloriesData = dates.map(date => dataByDate[date].calories);
        const timeData = dates.map(date => dataByDate[date].time);
        
        // Graphique des calories
        const caloriesCanvas = this.querySelector('#caloriesChart');
        if (caloriesCanvas) {
            this.caloriesChart = new Chart(caloriesCanvas, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'Calories brûlées',
                        data: caloriesData,
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
        
        // Graphique du temps
        const timeCanvas = this.querySelector('#timeChart');
        if (timeCanvas) {
            this.timeChart = new Chart(timeCanvas, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'Minutes d\'entraînement',
                        data: timeData,
                        borderColor: '#4a90e2',
                        backgroundColor: 'rgba(74, 144, 226, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
    }
    
    formatCategory(category) {
        const categories = {
            'musculation': 'Musculation',
            'cardio': 'Cardio',
            'yoga': 'Yoga',
            'natation': 'Natation',
            'course': 'Course',
            'vélo': 'Vélo',
            'marche': 'Marche'
        };
        return categories[category] || category;
    }
}

customElements.define('dashboard-component', DashboardComponent);

