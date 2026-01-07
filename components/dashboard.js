// Composant tableau de bord
class DashboardComponent extends HTMLElement {
    constructor() {
        super();
        this.pieChart = null;
        this.caloriesChart = null;
        this.timeChart = null;
        this.barChart = null;
        this.radarChart = null;
        this.weeklyChart = null;
        this.durationChart = null;
    }
    
    connectedCallback() {
        // Attendre que l'application soit initialisée
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.init();
            });
        } else {
            // Si le DOM est déjà chargé, attendre un peu pour que main.js s'initialise
            setTimeout(() => this.init(), 100);
        }
    }
    
    init() {
        this.render();
        this.refresh();
        
        // Écouter les événements de sauvegarde
        document.addEventListener('workout-saved', () => {
            this.refresh();
        });
        
        // Écouter les changements d'état de l'application
        const checkInterval = setInterval(() => {
            if (window.appState && window.appState.getCurrentUser) {
                const user = window.appState.getCurrentUser();
                if (user && this.innerHTML === '') {
                    this.render();
                    this.refresh();
                }
                clearInterval(checkInterval);
            }
        }, 200);
        
        // Arrêter la vérification après 5 secondes
        setTimeout(() => clearInterval(checkInterval), 5000);
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
                    
                    
                    
                </div>
                

                    
                    <div class="chart-container">
                        <h3 style="margin-bottom: 1rem;">Répartition des activités (Radar)</h3>
                        <canvas id="radarChart"></canvas>
                    </div>
                </div>
                
                <div class="dashboard-grid" style="margin-top: 2rem;">
                    <div class="chart-container">
                        <h3 style="margin-bottom: 1rem;">Séances par semaine</h3>
                        <canvas id="weeklyChart"></canvas>
                    </div>
                    
                    <div class="chart-container">
                        <h3 style="margin-bottom: 1rem;">Durée moyenne par activité</h3>
                        <canvas id="durationChart"></canvas>
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
        if (!this.workouts || this.workouts.length === 0) {
            // Afficher un message si pas de données
            const chartContainers = this.querySelectorAll('.chart-container');
            chartContainers.forEach(container => {
                const canvas = container.querySelector('canvas');
                if (canvas && !canvas.parentElement.querySelector('.no-data-message')) {
                    const message = document.createElement('p');
                    message.className = 'no-data-message';
                    message.style.cssText = 'text-align: center; color: #6c757d; padding: 2rem; font-style: italic;';
                    message.textContent = 'Aucune donnée disponible. Ajoutez des entraînements pour voir les graphiques.';
                    canvas.parentElement.insertBefore(message, canvas);
                    canvas.style.display = 'none';
                }
            });
            return;
        }
        
        // Masquer les messages "pas de données"
        this.querySelectorAll('.no-data-message').forEach(msg => msg.remove());
        this.querySelectorAll('.chart-container canvas').forEach(canvas => {
            canvas.style.display = 'block';
        });
        
        // Détruire les graphiques existants
        if (this.pieChart) this.pieChart.destroy();
        if (this.caloriesChart) this.caloriesChart.destroy();
        if (this.timeChart) this.timeChart.destroy();
        if (this.barChart) this.barChart.destroy();
        if (this.radarChart) this.radarChart.destroy();
        if (this.weeklyChart) this.weeklyChart.destroy();
        if (this.durationChart) this.durationChart.destroy();
        
        // Graphique en camembert - Répartition par catégorie
        this.updatePieChart();
        
        // Graphiques de tendance - Calories et temps
        this.updateTrendCharts();
        
        // Nouveaux graphiques
        this.updateBarChart();
        this.updateRadarChart();
        this.updateWeeklyChart();
        this.updateDurationChart();
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
    
    updateBarChart() {
        const barCanvas = this.querySelector('#barChart');
        if (!barCanvas) return;
        
        // Calculer les calories totales par type d'activité
        const caloriesByCategory = {};
        this.workouts.forEach(workout => {
            const category = workout.activity_type;
            caloriesByCategory[category] = (caloriesByCategory[category] || 0) + (workout.calories_burned || 0);
        });
        
        const categories = Object.keys(caloriesByCategory);
        const calories = Object.values(caloriesByCategory);
        
        const colors = [
            '#4a90e2', '#50c878', '#e74c3c', '#f39c12',
            '#9b59b6', '#1abc9c', '#e67e22'
        ];
        
        this.barChart = new Chart(barCanvas, {
            type: 'bar',
            data: {
                labels: categories.map(cat => this.formatCategory(cat)),
                datasets: [{
                    label: 'Calories brûlées',
                    data: calories,
                    backgroundColor: colors.slice(0, categories.length).map(c => c + '80'),
                    borderColor: colors.slice(0, categories.length),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Calories'
                        }
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
    
    updateRadarChart() {
        const radarCanvas = this.querySelector('#radarChart');
        if (!radarCanvas) return;
        
        // Compter les séances par type
        const sessionsByCategory = {};
        const allCategories = ['musculation', 'cardio', 'yoga', 'natation', 'course', 'vélo', 'marche'];
        
        allCategories.forEach(cat => {
            sessionsByCategory[cat] = 0;
        });
        
        this.workouts.forEach(workout => {
            if (sessionsByCategory.hasOwnProperty(workout.activity_type)) {
                sessionsByCategory[workout.activity_type]++;
            }
        });
        
        const labels = allCategories.map(cat => this.formatCategory(cat));
        const data = allCategories.map(cat => sessionsByCategory[cat]);
        
        this.radarChart = new Chart(radarCanvas, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Nombre de séances',
                    data: data,
                    backgroundColor: 'rgba(74, 144, 226, 0.2)',
                    borderColor: '#4a90e2',
                    borderWidth: 2,
                    pointBackgroundColor: '#4a90e2',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#4a90e2'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
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
    
    updateWeeklyChart() {
        const weeklyCanvas = this.querySelector('#weeklyChart');
        if (!weeklyCanvas) return;
        
        // Grouper par semaine
        const weeklyData = {};
        this.workouts.forEach(workout => {
            const date = new Date(workout.date);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay()); // Dimanche
            weekStart.setHours(0, 0, 0, 0);
            
            const weekKey = weekStart.toISOString().split('T')[0];
            weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 1;
        });
        
        const weeks = Object.keys(weeklyData).sort();
        const sessions = weeks.map(week => weeklyData[week]);
        
        // Formater les dates pour l'affichage
        const weekLabels = weeks.map(week => {
            const date = new Date(week);
            return `Sem. ${date.getDate()}/${date.getMonth() + 1}`;
        });
        
        this.weeklyChart = new Chart(weeklyCanvas, {
            type: 'bar',
            data: {
                labels: weekLabels,
                datasets: [{
                    label: 'Séances',
                    data: sessions,
                    backgroundColor: '#50c878',
                    borderColor: '#3da85a',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        },
                        title: {
                            display: true,
                            text: 'Nombre de séances'
                        }
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
    
    updateDurationChart() {
        const durationCanvas = this.querySelector('#durationChart');
        if (!durationCanvas) return;
        
        // Calculer la durée moyenne par type d'activité
        const durationByCategory = {};
        const countByCategory = {};
        
        this.workouts.forEach(workout => {
            const category = workout.activity_type;
            if (!durationByCategory[category]) {
                durationByCategory[category] = 0;
                countByCategory[category] = 0;
            }
            durationByCategory[category] += workout.duration_minutes || 0;
            countByCategory[category]++;
        });
        
        const categories = Object.keys(durationByCategory);
        const avgDurations = categories.map(cat => 
            Math.round(durationByCategory[cat] / countByCategory[cat])
        );
        
        const colors = [
            '#4a90e2', '#50c878', '#e74c3c', '#f39c12',
            '#9b59b6', '#1abc9c', '#e67e22'
        ];
        
        this.durationChart = new Chart(durationCanvas, {
            type: 'doughnut',
            data: {
                labels: categories.map(cat => this.formatCategory(cat)),
                datasets: [{
                    data: avgDurations,
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
                                return `${context.label}: ${context.parsed} min (moyenne)`;
                            }
                        }
                    }
                }
            }
        });
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

