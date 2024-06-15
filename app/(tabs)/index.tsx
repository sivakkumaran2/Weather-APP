import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import * as Location from 'expo-location';
import * as Network from 'expo-network';

const API_KEY = '58672adfac714281b6263000242705';

interface Weather {
  location: {
    name: string;
  };
  current: {
    temp_c: number;
    condition: {
      text: string;
    };
  };
}

interface LocationCoords {
  latitude: number;
  longitude: number;
}

export default function Index() {
  const [city, setCity] = useState<string>('');
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);

  useEffect(() => {
    checkNetworkConnection();
  }, []);

  const checkNetworkConnection = async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      setIsConnected(networkState.isConnected ?? false);
    } catch (error) {
      console.error('Error checking network connection:', error);
    }
  };

  const fetchWeather = async (location: LocationCoords | null = null) => {
    let query = city.trim();
    if (!query && !location) return;

    setLoading(true);
    setError(null);

    try {
      let url = `http://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=`;
      url += location ? `${location.latitude},${location.longitude}` : query;

      const response = await axios.get<Weather>(url);
      if (response.data) {
        setWeather(response.data);
      } else {
        throw new Error('No weather data received');
      }
    } catch (error: any) {
      console.error('Error fetching weather data:', error.message);
      setError('Error fetching weather data: ' + error.message);
      Alert.alert('Error', 'Error fetching weather data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getLocationAndFetchWeather = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const coords: LocationCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        fetchWeather(coords);
      } else if (status === 'denied') {
        Alert.alert(
          'Location Permission Denied',
          'Please enable location.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'OK', onPress: () => askForPermissionAgain() },
          ]
        );
      } else {
        setError('Location permission error: Permission status is not granted.');
      }
    } catch (error: any) {
      console.error('Error getting location permission:', error.message);
      setError('Error getting location permission: ' + error.message);
    }
  };

  const askForPermissionAgain = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'denied') {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status === 'granted') {
          getLocationAndFetchWeather();
        } else {
          setError('Location permission error: Permission status is denied.');
        }
      }
    } catch (error: any) {
      console.error('Error requesting location permission again:', error.message);
      setError('Error requesting location permission again: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weather Day</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter city name"
        value={city}
        onChangeText={setCity}
      />
      <Pressable style={styles.button} onPress={() => fetchWeather()}>
        <Text style={styles.buttonText}>Get Weather</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={getLocationAndFetchWeather}>
        <Text style={styles.buttonText}>Use Current Location</Text>
      </Pressable>
      {!isConnected && <Text style={styles.error}>No internet connection</Text>}
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      {error && <Text style={styles.error}>{error}</Text>}
      {weather && weather.current && (
        <View style={styles.weatherContainer}>
          <Text style={styles.city}>{weather.location.name}</Text>
          <Text style={styles.temperature}>{weather.current.temp_c}°C</Text>
          {weather.current.condition && (
            <Text style={styles.description}>{weather.current.condition.text}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginBottom: 10,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  error: {
    color: 'red',
    marginTop: 20,
    fontSize: 16,
  },
  weatherContainer: {
    marginTop: 40,
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 4,
    alignItems: 'center',
  },
  city: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  temperature: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007bff',
  },
  description: {
    fontSize: 20,
    fontStyle: 'italic',
    color: '#555',
  },
});

