import { Easing } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import ExploreNav from './ExploreNav';
import ScreenNav from './ScreenNav';
import { Ionicons } from '@expo/vector-icons';



const Tab = createBottomTabNavigator();

const TabNavigator = () => {

    return (
        <Tab.Navigator

            initialRouteName="APOD"
            screenOptions={({ route }) => ({

                tabBarIcon: ({ focused, size }) => {
                    if (route.name === "APOD") {
                        return (
                            <Ionicons
                                name="image-outline"
                                size={24}
                                color={focused ? "white" : "gray"}
                                style={{ marginBottom: 6 }}
                            />
                        );
                    } else if (route.name === "Explore") {
                        return (
                            <Ionicons
                                name="compass-outline"
                                size={24}
                                color={focused ? "white" : "gray"}
                                style={{ marginBottom: 6 }}
                            />
                        );
                    } else if (route.name === "Favorites") {
                        return (
                            <Ionicons
                                name="heart-outline"
                                size={24}
                                color={focused ? "white" : "gray"}
                                style={{ marginBottom: 6 }}
                            />
                        );
                    }
                },
                tabBarShowLabel: true,
                headerShown: true,
                headerTitleAlign: "center",
                headerStyle: { backgroundColor: "#000000" },
                tabBarStyle: {
                    backgroundColor: "#000000",
                    borderTopColor: "#222",
                    paddingTop: 8,
                    height: 78,
                    alignContent: "center",
                    alignItems: "center",
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                },
                animation: "fade",
                transitionSpec: {
                    animation: "timing", config: {
                        duration: 500,
                        easing: Easing.ease,
                    }
                },
                tabBarActiveTintColor: "white",
                tabBarInactiveTintColor: "gray",

            })}
        >
            <Tab.Screen options={{
                headerShown: false
            }} name="APOD" component={HomeScreen} />
            <Tab.Screen options={{ headerShown: false }} name="Explore" component={ExploreNav} />
            <Tab.Screen name="Favorites" component={ScreenNav} options={{ headerShown: false }} />


        </Tab.Navigator >
    );
};

export default TabNavigator;
