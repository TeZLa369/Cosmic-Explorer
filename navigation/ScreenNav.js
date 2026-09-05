import { createStackNavigator } from "@react-navigation/stack";
import Favs from "../screens/Favs";
import CommonFavScreen from "../screens/CommonFavScreen";
import AsteroidFav from "../screens/AsteroidFav";
import SpaceFavScreen from "../screens/SpaceFavScreen";

const Stack = createStackNavigator();

export default function ScreenNav() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="Favs" component={Favs} />
            <Stack.Screen name="CommonFavScreen" component={CommonFavScreen} />
            <Stack.Screen name="SpaceFavScreen" component={SpaceFavScreen} />
            <Stack.Screen name="AsteroidFav" component={AsteroidFav} />
        </Stack.Navigator>
    );
}
