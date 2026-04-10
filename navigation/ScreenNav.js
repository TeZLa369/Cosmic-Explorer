import { createStackNavigator } from "@react-navigation/stack";
import Favs from "../screens/Favs";
import CommonFavScreen from "../screens/CommonFavScreen";
import AsteroidFav from "../screens/AsteroidFav";
import SpaceFavScreen from "../screens/SpaceFavScreen";
import { Image } from "react-native";

const Stack = createStackNavigator();

export default function ScreenNav() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}>
            <Stack.Screen name="Favs" component={Favs} />
            <Stack.Screen name="CommonFavScreen" component={CommonFavScreen} />
            <Stack.Screen name="SpaceFavScreen" component={SpaceFavScreen} />

            <Stack.Screen options={{
                headerLeft: () => null, headerTitleAlign: "center", headerStyle: { backgroundColor: "#000000" }, headerShown: true,
                headerTitle: () => (<Image source={require("../assets/nasa.png")} height={100} width={100} style={{ height: 50, width: 60 }} />)
            }} name="AsteroidFav" component={AsteroidFav} />
        </Stack.Navigator>
    );
}
