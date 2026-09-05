import { View, StyleSheet, Easing } from 'react-native';
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
                tabBarIcon: ({ focused }) => {
                    let iconName;
                    if (route.name === "APOD") {
                        iconName = focused ? "image" : "image-outline";
                    } else if (route.name === "Explore") {
                        iconName = focused ? "compass" : "compass-outline";
                    } else if (route.name === "Favorites") {
                        iconName = focused ? "heart" : "heart-outline";
                    }

                    return (
                        <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
                            <Ionicons
                                name={iconName}
                                size={22}
                                color={focused ? "#89D9FF" : "#8A99AD"}
                            />
                        </View>
                    );
                },
                tabBarShowLabel: true,
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: "#050913",
                    borderTopColor: "rgba(255, 255, 255, 0.1)",
                    borderTopWidth: 1,
                    paddingTop: 6,
                    height: 78,
                    alignContent: "center",
                    alignItems: "center",
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: "600",
                    letterSpacing: 0.3,
                    marginBottom: 4,
                },
                animation: "fade",
                transitionSpec: {
                    animation: "timing",
                    config: {
                        duration: 350,
                        easing: Easing.ease,
                    }
                },
                tabBarActiveTintColor: "#89D9FF",
                tabBarInactiveTintColor: "#8A99AD",
            })}
        >
            <Tab.Screen name="APOD" component={HomeScreen} />
            <Tab.Screen name="Explore" component={ExploreNav} />
            <Tab.Screen name="Favorites" component={ScreenNav} />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    iconContainer: {
        width: 44,
        height: 28,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 2,
    },
    iconContainerFocused: {
        backgroundColor: "rgba(137, 217, 255, 0.16)",
    },
});

export default TabNavigator;
