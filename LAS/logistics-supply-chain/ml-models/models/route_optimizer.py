import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import json

class RouteOptimizer:
    """
    Genetic Algorithm-based route optimization with constraint satisfaction
    Optimizes for: distance, time, fuel, vehicle capacity, traffic
    """
    
    def __init__(self, population_size=100, generations=50):
        self.population_size = population_size
        self.generations = generations
        self.best_route = None
        self.best_fitness = float('inf')
    
    def calculate_distance(self, point1, point2):
        """Calculate Euclidean distance between two points (lat, lng)"""
        lat1, lng1 = point1
        lat2, lng2 = point2
        return np.sqrt((lat2 - lat1)**2 + (lng2 - lng1)**2) * 111  # Approximate km
    
    def calculate_route_cost(self, route, waypoints, vehicle_capacity):
        """
        Calculate total cost of a route
        Cost = distance * fuel_factor + time_penalty + capacity_penalty
        """
        total_distance = 0
        total_items = 0
        
        for i in range(len(route) - 1):
            waypoint1 = waypoints[route[i]]
            waypoint2 = waypoints[route[i + 1]]
            distance = self.calculate_distance(waypoint1['location'], waypoint2['location'])
            total_distance += distance
            total_items += waypoint2.get('items', 0)
        
        # Penalties
        capacity_penalty = 1000 if total_items > vehicle_capacity else 0
        
        # Cost calculation (fuel ~0.1 per km)
        fuel_cost = total_distance * 0.1
        
        return fuel_cost + capacity_penalty
    
    def optimize(self, waypoints, vehicle_capacity, fuel_consumption_km=0.1):
        """
        Optimize route using genetic algorithm
        Returns: optimized route order, fuel savings estimate, carbon reduction
        """
        num_waypoints = len(waypoints)
        
        # Initialize population with random routes
        population = []
        for _ in range(self.population_size):
            route = list(range(num_waypoints))
            np.random.shuffle(route)
            population.append(route)
        
        # Evolve
        for generation in range(self.generations):
            fitness_scores = []
            
            for route in population:
                cost = self.calculate_route_cost(route, waypoints, vehicle_capacity)
                fitness_scores.append(cost)
            
            # Track best
            best_idx = np.argmin(fitness_scores)
            if fitness_scores[best_idx] < self.best_fitness:
                self.best_fitness = fitness_scores[best_idx]
                self.best_route = population[best_idx]
            
            # Selection and crossover
            sorted_indices = np.argsort(fitness_scores)
            elite_size = self.population_size // 4
            elite_routes = [population[i] for i in sorted_indices[:elite_size]]
            
            new_population = elite_routes[:]
            while len(new_population) < self.population_size:
                parent1 = np.random.choice(elite_routes)
                parent2 = np.random.choice(elite_routes)
                child = self._crossover(parent1, parent2)
                child = self._mutate(child)
                new_population.append(child)
            
            population = new_population[:self.population_size]
        
        # Calculate metrics
        original_distance = sum(
            self.calculate_distance(waypoints[i]['location'], waypoints[i+1]['location'])
            for i in range(len(waypoints)-1)
        )
        optimized_distance = self.calculate_route_cost(self.best_route, waypoints, vehicle_capacity) / 0.1
        
        fuel_savings = (original_distance - optimized_distance) * 0.1
        carbon_reduction = fuel_savings * 2.3  # kg CO2 per liter diesel
        
        return {
            'optimized_route': [int(i) for i in self.best_route],
            'total_distance_km': float(optimized_distance),
            'fuel_savings': float(fuel_savings),
            'carbon_reduction_kg': float(carbon_reduction),
            'estimated_time_hours': float(optimized_distance / 50)  # Assume avg 50 km/h
        }
    
    def _crossover(self, parent1, parent2):
        """Order crossover for TSP"""
        size = len(parent1)
        start, end = sorted([np.random.randint(0, size) for _ in range(2)])
        
        child = [-1] * size
        child[start:end] = parent1[start:end]
        
        pointer = end
        for item in parent2:
            if item not in child:
                if pointer >= size:
                    pointer = 0
                child[pointer] = item
                pointer += 1
        
        return child
    
    def _mutate(self, route, mutation_rate=0.02):
        """Swap mutation"""
        route = route[:]
        for _ in range(len(route)):
            if np.random.random() < mutation_rate:
                i, j = np.random.choice(len(route), 2, replace=False)
                route[i], route[j] = route[j], route[i]
        return route


if __name__ == '__main__':
    # Test
    optimizer = RouteOptimizer()
    waypoints = [
        {'location': (28.7041, 77.1025), 'items': 100},
        {'location': (28.5355, 77.3910), 'items': 150},
        {'location': (28.6139, 77.2090), 'items': 200},
    ]
    
    result = optimizer.optimize(waypoints, vehicle_capacity=500)
    print(json.dumps(result, indent=2))
