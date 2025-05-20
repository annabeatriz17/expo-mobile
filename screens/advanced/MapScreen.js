import React, { useState, useEffect, useRef, use } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    Button,
    Keyboard,
    ActivityIndicator
} from 'react-native';
import axios from 'axios';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';

const MAPbOX_TOKEN = "pk.eyJ1IjoibWFyY2VsbG8tMDAiLCJhIjoiY205c2xyMWdqMDIxODJqb3RtNGEwdjh3eCJ9.TvGmRpmgcnJqZb-GfZSdFw";

export default function MapScreen() {
    const [location, setLocation] = useState(null);
    const [routeCoords, setRouteCoords] = useState([]);
    const [destination, setDestination] = useState('');
    const [loading, setLoading] = useState(false);

    const mapRef = useRef(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestPermissionsAsync();
            if (status !== "granted") {
                alert("Permissão negada para acessar a localização");
                return;
            }

            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc.coords);
        })();
    }, []);

    const buscarDestino = async () => {
        if (!destination) return;

        try {
            Keyboard.dismiss();
            setLoading(true);

            const geoURL = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
                destination
            )}.json?access_token=${MAPbOX_TOKEN}`;

            const geoRes = await axios.get(geoURL);

            if (!geoRes.data.features || geoRes.data.features.length === 0) {
                alert("Destino não encontrado");
                return;
            }

            const coords = geoRes.data.features[0].geometry.coordinates;
            const destinoCoords = {
                latitude: coords[1],
                longitude: coords[0],
            };

            await tracarRota(location, destinoCoords);
        } catch (error) {
            alert("Erro ao buscar destino.");
        } finally {
            setLoading(false);
        }

        const tracarRota = async (origem, destino) => {
            const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origem.longitude},${origem.latitude};${destino.longitude},${destino.latitude}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;

            const res = await axios.get(url); // Faz a requisição à API
            const coords = res.data.routes[0].geometry.coordinates.map(
                ([lon, lat]) => ({
                    latitude: lat,
                    longitude: lon,
                })
            );

            setRouteCoords(coords);

            mapRef.current?.filToCoordinates(coords, {
                edgePadding: { top: 50, bottom: 50, left: 50, right: 50 },
                animated: true,
            });

        };

        const resetarMapa = () => {
            setRouteCoords([]);
            setDestination("");
            if (location) {
                mapRef.current?.animateToRegion({
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                });
            }
        };

return (
    <View style={styles.container}>
        {location ? (
            <>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    initialRegion={{
                        latitude: location.latitude,
                        longitude: location.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    }}
                >
                <Marker coordinate={location} title="Você" />
                    {routeCoords.length > 0 && (
                        <>
                            <Polyline
                                coordinates={routeCoords}
                                strokeColor="#ff0080"
                                strokeWidth={4}
                            />

                            <Marker
                                coordinate={routeCoords[routeCoords.length - 1]}
                                title="Destino"
                            />
                        </>
                    )}

            </MapView>
                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#ec9ec0" />
                        <Text>Buscando rota ...</Text>
                    </View>
                    )}

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input} placeholder="Digite um endereço" value={destination} onChangeText={setDestination} />
                        <View style={styles.buttons}>
                            <Button title="Buscar" onPress={buscarDestino} disabled={loading} />
                            <Button title="Resetar" color="#ec9ec0" onPress={resetarMapa} />
                        </View>
                    </View>
                </>
            ) : (
                <Text>Carregando localização ...</Text>
            )}
        </View>
    );
}
};

const styles = StyleSheet.create({
    container: { flex: 1 },
  map: { flex: 1 },
  inputContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
    elevation: 5,
  },
  input: {
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  loadingContainer: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    alignItems: "center",
  },
});