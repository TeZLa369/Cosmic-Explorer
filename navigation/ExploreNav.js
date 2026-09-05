import { createStackNavigator } from "@react-navigation/stack";
import ExploreHub from "../screens/ExploreHub";
import EPIC from "../screens/EPIC";
import DONKI from "../screens/DONKI";
import Asteroid from "../screens/Asteroid";
import Eonet from "../screens/Eonet";
import MarsRover from "../screens/Mars_rover";
import ISSTracker from "../screens/ISSTracker";

const Stack = createStackNavigator();

export default function ExploreNav() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ExploreHub" component={ExploreHub} />
      <Stack.Screen name="ISSTracker" component={ISSTracker} />
      <Stack.Screen name="EPIC" component={EPIC} />
      <Stack.Screen name="DONKI" component={DONKI} />
      <Stack.Screen name="EONET" component={Eonet} />
      <Stack.Screen name="Rover" component={MarsRover} />
      <Stack.Screen name="Asteroid" component={Asteroid} />
    </Stack.Navigator>
  );
}
