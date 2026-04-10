import { Image } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import ExploreHub from "../screens/ExploreHub";
import EPIC from "../screens/EPIC";
import DONKI from "../screens/DONKI";
import Asteroid from "../screens/Asteroid";

const Stack = createStackNavigator();

const headerWithLogo = {
  headerTitleAlign: "center",
  headerStyle: { backgroundColor: "#000000" },
  headerTitle: () => (
    <Image
      source={require("../assets/nasa.png")}
      height={100}
      width={100}
      style={{ height: 50, width: 60 }}
    />
  ),
};

export default function ExploreNav() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ExploreHub" component={ExploreHub} />
      <Stack.Screen name="EPIC" component={EPIC} options={{ headerShown: false }} />
      <Stack.Screen name="DONKI" component={DONKI} options={{ headerShown: false }} />
      <Stack.Screen
        name="Asteroid"
        component={Asteroid}
        options={{
          headerShown: true,
          ...headerWithLogo,
        }}
      />
    </Stack.Navigator>
  );
}
