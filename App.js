import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, Button, TextInput } from "react-native";
import { useState, useEffect } from "react";
import { BarCodeScanner } from "expo-barcode-scanner";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);

  const [reservationId, setReservationId] = useState(null);
  const [reservation, setReservation] = useState(null);

  const [shouldScan, setShouldScan] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();

  const askForCameraPermission = () => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status == "granted");
    })();
  };

  //Request camera permission
  useEffect(() => {
    askForCameraPermission();
  }, []);

  useEffect(() => {
    if (reservationId) {
      fetchReservationById();
    }
  }, [reservationId]);

  //What happens when we scan bar code
  const handleBarCodeScanned = ({ type, data }) => {
    try {
      if (data) {
        setReservationId(data);
        setShouldScan(false);
      } else {
        console.error("Invalid QR code data. Missing 'id' field.");
        setShouldScan(false);
      }
    } catch (error) {
      console.error("Error parsing QR code data:", error);
      setShouldScan(false);
    }
  };

  const fetchReservationById = async () => {
    const token = await AsyncStorage.getItem("nc_token");
    console.log(token, 'here');
    const response = await fetch(
      `http://192.168.0.11:4000/api/reservations/single/${reservationId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      }
    );

    const json = await response.json();
    if (response.ok) {
      setReservation(json);
    } else {
      console.log("An error accured.", json);
    }
  };

  const handleLogin = async () => {
    const data = {
      email: email,
      password: password,
    };

    const response = await fetch(`http://192.168.0.11:4000/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const json = await response.json();
    if (response.ok) {
      await AsyncStorage.setItem("nc_token", json.token);
      setIsLoggedIn(true);
    } else {
      console.log("An error accured.", json);
    }
  };

  // Complete reservation function
  const completeReservation = async () => {
    const token = AsyncStorage.getItem("nc_token");
    const response = await fetch(
      `http://192.168.0.11:4000/api/reservations/complete/${reservationId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      }
    );
    const json = await response.json();
    if (response.ok) {
      console.log("Reservation complete!", json);
      setReservation(json);
    } else {
      console.log("An error accured.", json);
    }
  };

  const resetState = () => {
    setReservation(null);
    setReservationId(null);
    setShouldScan(false);
  };

  //Check permissions and return the screens
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting for camera permission</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={{ margin: 10 }}>No access to camera</Text>
        <Button
          title={"Allow Camera"}
          onPress={() => askForCameraPermission()}
        />
      </View>
    );
  }

  return (
    <>
      {isLoggedIn && !reservationId && (
        <View style={styles.container}>
          <View style={styles.barcodebox}>
            <BarCodeScanner
              onBarCodeScanned={shouldScan && handleBarCodeScanned}
              style={{ height: 400, width: 400 }}
            />
          </View>

          <Button
            title={"Scan"}
            onPress={() => {
              setShouldScan(true);
            }}
            color="tomato"
          />
        </View>
      )}
      {isLoggedIn && reservationId && reservation && (
        <View style={styles.container}>
          <View style={styles.container}>
            <Text style={styles.maintext}>Reservation:</Text>
            <Text style={styles.maintext}>Name: {reservation.name}</Text>
            <Text style={styles.maintext}>Phone: {reservation.phone}</Text>
            <Text style={styles.maintext}>Persons: {reservation.persons}</Text>
            <Text style={styles.maintext}>Table: {reservation.table}</Text>
            <Text style={styles.maintext}>Status: {reservation.status}</Text>
          </View>
          {/* Hide complete button if reservation is already completed. */}
          {reservation.status !== "Complete" && (
            <>
              <Button
                title={"Complete"}
                onPress={completeReservation}
                color="tomato"
              />
              <Button title={"Cancel"} onPress={resetState} color="tomato" />
            </>
          )}
          {reservation.status === "Complete" && (
            <Button title={"Scan Again?"} onPress={resetState} color="tomato" />
          )}
        </View>
      )}

      {!isLoggedIn && (
        <View style={styles.containerGap}>
          <Text stlye={styles.maintext}>Log in</Text>
          <View>
            <Text>Enter your email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              onChangeText={(value) => setEmail(value)}
            />
            <Text>Enter your password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              secureTextEntry={true}
              onChangeText={(value) => setPassword(value)}
            />
            <Button title={"Log in"} onPress={handleLogin} />
          </View>
        </View>
      )}
    </>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  containerGap: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: 3,
  },

  input: {
    height: 40,
    borderColor: "#7a42f4",
    borderWidth: 1,
    padding: 3,
  },

  barcodebox: {
    alignItems: "center",
    justifyContent: "center",
    height: 300,
    width: 300,
    overflow: "hidden",
    borderRadius: 30,
    backgroundColor: "tomato",
  },
  completeBox: {
    alignItems: "center",
    justifyContent: "center",
    height: 300,
    width: 300,
    overflow: "hidden",
    borderRadius: 30,
    backgroundColor: "green",
  },
  alreadyUsed: {
    alignItems: "center",
    justifyContent: "center",
    height: 300,
    width: 300,
    overflow: "hidden",
    borderRadius: 30,
    backgroundColor: "red",
  },
  maintext: {
    fontSize: 16,
    margin: 20,
  },
  successText: {
    fontSize: 16,
    margin: "auto",
    color: "white",
  },
  errorText: {
    fontSize: 16,
    margin: "auto",
    color: "white",
  },
});
