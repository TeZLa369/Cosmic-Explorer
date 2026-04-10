import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  textPrimary: "#F9F6F2",
  textSecondary: "#DCE3F4",
  textMuted: "#A8B4D0",
  accent: "#8FD2FF",
  accentSoft: "rgba(143,210,255,0.18)",
  surface: "rgba(255,255,255,0.08)",
  surfaceSoft: "rgba(255,255,255,0.12)",
  border: "rgba(255,255,255,0.16)",
  shadow: "rgba(0,0,0,0.34)",
};

const EVENT_OPTIONS = [
  { key: "FLR", label: "Flares", icon: "flash-outline" },
  { key: "CME", label: "CMEs", icon: "sunny-outline" },
  { key: "GST", label: "Storms", icon: "warning-outline" },
  { key: "SEP", label: "Particles", icon: "planet-outline" },
];

const DONKI_BASE = "https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get";

const formatApiDate = (dateValue) => {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatLongDate = (dateValue) => new Date(dateValue).toLocaleDateString("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

const formatDateTime = (dateValue) => {
  if (!dateValue) return "--";
  return new Date(dateValue).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
};

const formatInstruments = (instruments) => {
  if (!Array.isArray(instruments) || instruments.length === 0) return "Unknown instruments";
  return instruments.map((item) => item?.displayName).filter(Boolean).join(", ") || "Unknown instruments";
};

const subtractDays = (dateValue, days) => {
  const nextDate = new Date(dateValue);
  nextDate.setDate(nextDate.getDate() - days);
  return nextDate;
};

const normalizeEvents = (eventType, payload) => {
  if (!Array.isArray(payload)) return [];

  if (eventType === "FLR") {
    return payload.map((item, index) => ({
      id: item.flrID || `flr-${index}`,
      storageKey: `donki_FLR_${item.flrID || `flr-${index}`}`,
      eventType: "FLR",
      title: item.classType ? `${item.classType} Solar Flare` : "Solar Flare",
      time: item.peakTime || item.beginTime || item.begineTime,
      primaryMetricLabel: "CLASS",
      primaryMetricValue: item.classType || "--",
      secondaryMetricLabel: "REGION",
      secondaryMetricValue: item.activeRegionNum ? `AR ${item.activeRegionNum}` : (item.sourceLocation || "Unknown"),
      tertiaryMetricLabel: "SOURCE",
      tertiaryMetricValue: item.sourceLocation || "Unavailable",
      description: item.note || "No analyst note was published for this flare.",
      instruments: formatInstruments(item.instruments),
      link: item.link,
    }));
  }

  if (eventType === "CME") {
    return payload.map((item, index) => {
      const analysis = Array.isArray(item.cmeAnalyses) && item.cmeAnalyses.length > 0
        ? item.cmeAnalyses[0]
        : null;

      return {
        id: item.activityID || `cme-${index}`,
        storageKey: `donki_CME_${item.activityID || `cme-${index}`}`,
        eventType: "CME",
        title: "Coronal Mass Ejection",
        time: item.startTime,
        primaryMetricLabel: "SPEED",
        primaryMetricValue: analysis?.speed ? `${Math.round(analysis.speed)} km/s` : "Pending",
        secondaryMetricLabel: "HALF ANGLE",
        secondaryMetricValue: analysis?.halfAngle ? `${Math.round(analysis.halfAngle)}°` : "--",
        tertiaryMetricLabel: "SOURCE",
        tertiaryMetricValue: item.sourceLocation || "Unavailable",
        description: item.note || analysis?.note || "No analyst note was published for this CME.",
        instruments: formatInstruments(item.instruments),
        link: item.link,
      };
    });
  }

  if (eventType === "GST") {
    return payload.map((item, index) => {
      const kpValues = Array.isArray(item.allKpIndex) ? item.allKpIndex : [];
      const strongest = kpValues.reduce((max, kp) => {
        const current = Number(kp?.kpIndex || kp?.KpIndex || 0);
        return current > max ? current : max;
      }, 0);

      return {
        id: item.gstID || `gst-${index}`,
        storageKey: `donki_GST_${item.gstID || `gst-${index}`}`,
        eventType: "GST",
        title: "Geomagnetic Storm",
        time: item.startTime,
        primaryMetricLabel: "MAX KP",
        primaryMetricValue: strongest ? strongest.toFixed(1) : "--",
        secondaryMetricLabel: "READINGS",
        secondaryMetricValue: `${kpValues.length || 0} samples`,
        tertiaryMetricLabel: "LATEST SOURCE",
        tertiaryMetricValue: kpValues[kpValues.length - 1]?.source || "NOAA/Unknown",
        description: strongest
          ? `Peak geomagnetic activity reached Kp ${strongest.toFixed(1)} during this event.`
          : "Geomagnetic storm event captured without published Kp samples.",
        instruments: kpValues.length ? "Geomagnetic Kp observations" : "Storm record",
        link: item.link,
      };
    });
  }

  return payload.map((item, index) => ({
    id: item.sepID || `sep-${index}`,
    storageKey: `donki_SEP_${item.sepID || `sep-${index}`}`,
    eventType: "SEP",
    title: "Solar Energetic Particle Event",
    time: item.eventTime,
    primaryMetricLabel: "EVENT",
    primaryMetricValue: "SEP",
    secondaryMetricLabel: "INSTRUMENTS",
    secondaryMetricValue: Array.isArray(item.instruments) ? `${item.instruments.length}` : "0",
    tertiaryMetricLabel: "VERSION",
    tertiaryMetricValue: item.versionId ? `v${item.versionId}` : "Latest",
    description: "Energetic particle activity detected and cataloged by DONKI.",
    instruments: formatInstruments(item.instruments),
    link: item.link,
  }));
};

const EventCard = ({ item, accentColor, onToggleFavorite }) => (
  <View style={styles.eventCard}>
    <View style={styles.eventTopRow}>
      <View style={[styles.eventMetricChip, { backgroundColor: accentColor }]}>
        <Text style={styles.eventMetricChipLabel}>{item.primaryMetricLabel}</Text>
        <Text style={styles.eventMetricChipValue}>{item.primaryMetricValue}</Text>
      </View>
      <View style={styles.eventHeaderActions}>
        <View style={styles.eventTimeWrap}>
          <Text style={styles.eventTimeLabel}>EVENT TIME</Text>
          <Text style={styles.eventTimeValue}>{formatDateTime(item.time)} UTC</Text>
        </View>
        <Pressable
          style={[styles.eventSaveButton, item.saved && styles.eventSaveButtonActive]}
          onPress={() => onToggleFavorite(item)}
        >
          <Ionicons
            name={item.saved ? "heart" : "heart-outline"}
            size={18}
            color={item.saved ? "#FF9A92" : COLORS.textPrimary}
          />
        </Pressable>
      </View>
    </View>

    <Text style={styles.eventTitle}>{item.title}</Text>
    <Text style={styles.eventDescription}>{item.description}</Text>

    <View style={styles.eventMetaGrid}>
      <View style={styles.eventMetaTile}>
        <Text style={styles.eventMetaLabel}>{item.secondaryMetricLabel}</Text>
        <Text style={styles.eventMetaValue}>{item.secondaryMetricValue}</Text>
      </View>
      <View style={styles.eventMetaTile}>
        <Text style={styles.eventMetaLabel}>{item.tertiaryMetricLabel}</Text>
        <Text style={styles.eventMetaValue}>{item.tertiaryMetricValue}</Text>
      </View>
    </View>

    <Text style={styles.eventInstrumentText}>{item.instruments}</Text>

    {item.link ? (
      <Pressable style={styles.linkButton} onPress={() => Linking.openURL(item.link)}>
        <Text style={styles.linkButtonText}>Open NASA Event</Text>
        <Ionicons name="open-outline" size={16} color={COLORS.textPrimary} />
      </Pressable>
    ) : null}
  </View>
);

const DONKI = () => {
  const [eventType, setEventType] = useState("FLR");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [events, setEvents] = useState([]);

  const startDate = subtractDays(selectedDate, 6);
  const startDateKey = formatApiDate(startDate);
  const endDateKey = formatApiDate(selectedDate);

  const fetchEvents = async (typeKey, dateValue) => {
    const rangeEnd = formatApiDate(dateValue);
    const rangeStart = formatApiDate(subtractDays(dateValue, 6));
    setLoading(true);
    setFetchError("");

    try {
      const endpoint = `${DONKI_BASE}/${typeKey}?startDate=${rangeStart}&endDate=${rangeEnd}`;
      const res = await fetch(endpoint);
      const data = await res.json();

      if (!res.ok) {
        throw new Error("Unable to load DONKI data.");
      }

      const normalized = normalizeEvents(typeKey, data).sort((a, b) => {
        const timeA = a.time ? new Date(a.time).getTime() : 0;
        const timeB = b.time ? new Date(b.time).getTime() : 0;
        return timeB - timeA;
      });

      const savedState = await AsyncStorage.multiGet(normalized.map((item) => item.storageKey));
      const savedKeys = new Set(savedState.filter(([, value]) => value !== null).map(([key]) => key));

      setEvents(normalized.map((item) => ({
        ...item,
        saved: savedKeys.has(item.storageKey),
      })));
    } catch (error) {
      console.log("DONKI fetch error:", error);
      setEvents([]);
      setFetchError("We couldn't load space weather events right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(eventType, selectedDate);
  }, [eventType, selectedDate]);

  const summary = useMemo(() => {
    const firstEvent = events[0];

    if (eventType === "FLR") {
      const xCount = events.filter((item) => String(item.primaryMetricValue).startsWith("X")).length;
      return {
        primaryLabel: "TOTAL FLARES",
        primaryValue: `${events.length}`,
        secondaryLabel: "X-CLASS",
        secondaryValue: `${xCount}`,
      };
    }

    if (eventType === "CME") {
      const fastest = events.reduce((max, item) => {
        const speed = Number(String(item.primaryMetricValue).replace(/[^0-9.]/g, "")) || 0;
        return speed > max ? speed : max;
      }, 0);

      return {
        primaryLabel: "TOTAL CMES",
        primaryValue: `${events.length}`,
        secondaryLabel: "FASTEST",
        secondaryValue: fastest ? `${Math.round(fastest)} km/s` : "--",
      };
    }

    if (eventType === "GST") {
      const strongest = events.reduce((max, item) => {
        const kp = Number(item.primaryMetricValue) || 0;
        return kp > max ? kp : max;
      }, 0);

      return {
        primaryLabel: "STORMS",
        primaryValue: `${events.length}`,
        secondaryLabel: "PEAK KP",
        secondaryValue: strongest ? strongest.toFixed(1) : "--",
      };
    }

    return {
      primaryLabel: "SEP EVENTS",
      primaryValue: `${events.length}`,
      secondaryLabel: "LATEST",
      secondaryValue: firstEvent ? formatLongDate(firstEvent.time) : "--",
    };
  }, [eventType, events]);

  const accentColor = eventType === "FLR"
    ? "rgba(255,176,103,0.22)"
    : eventType === "CME"
      ? "rgba(143,210,255,0.2)"
      : eventType === "GST"
        ? "rgba(126,227,160,0.22)"
        : "rgba(244,160,255,0.22)";

  const toggleFavorite = async (item) => {
    try {
      if (item.saved) {
        await AsyncStorage.removeItem(item.storageKey);
      } else {
        const payload = {
          ...item,
          favoriteType: "DONKI",
          savedAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(item.storageKey, JSON.stringify(payload));
      }

      setEvents((prev) =>
        prev.map((eventItem) =>
          eventItem.storageKey === item.storageKey
            ? { ...eventItem, saved: !eventItem.saved }
            : eventItem
        )
      );
    } catch (error) {
      console.log("Unable to update DONKI favorite:", error);
    }
  };

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.container}>
      <LinearGradient
        colors={["#05070E", "#0A1122", "#070C18"]}
        style={styles.gradient}
      >
        <DateTimePickerModal
          isVisible={calendarVisible}
          mode="date"
          maximumDate={new Date()}
          themeVariant="dark"
          date={selectedDate}
          onConfirm={(date) => {
            setSelectedDate(date);
            setCalendarVisible(false);
          }}
          onCancel={() => setCalendarVisible(false)}
        />

        {loading ? (
          <View style={styles.centerState}>
            <View style={styles.loaderBadge}>
              <Ionicons name="flash-outline" size={26} color={COLORS.accent} />
            </View>
            <Text style={styles.centerTitle}>Loading space weather</Text>
            <Text style={styles.centerSubtitle}>Pulling the latest DONKI events from NASA CCMC.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.heroCard}>
              <View style={styles.heroBadge}>
                <Ionicons name="pulse-outline" size={16} color={COLORS.accent} />
                <Text style={styles.heroBadgeText}>SPACE WEATHER</Text>
              </View>

              <Text style={styles.heroTitle}>Monitor solar activity in the last seven days.</Text>
              <Text style={styles.heroSubtitle}>
                Browse NASA DONKI events including flares, CMEs, geomagnetic storms, and energetic particle activity.
              </Text>

              <Pressable style={styles.dateButton} onPress={() => setCalendarVisible(true)}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.accent} />
                <Text style={styles.dateButtonText}>
                  {formatLongDate(startDateKey)} to {formatLongDate(endDateKey)}
                </Text>
                <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
              </Pressable>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.eventTypeRow}
              >
                {EVENT_OPTIONS.map((option) => (
                  <Pressable
                    key={option.key}
                    style={[styles.eventTypeChip, eventType === option.key && styles.eventTypeChipActive]}
                    onPress={() => setEventType(option.key)}
                  >
                    <Ionicons
                      name={option.icon}
                      size={16}
                      color={eventType === option.key ? COLORS.textPrimary : COLORS.textMuted}
                    />
                    <Text style={[styles.eventTypeText, eventType === option.key && styles.eventTypeTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{summary.primaryLabel}</Text>
                <Text style={styles.summaryValue}>{summary.primaryValue}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{summary.secondaryLabel}</Text>
                <Text style={styles.summaryValue}>{summary.secondaryValue}</Text>
              </View>
            </View>

            <View style={styles.feedHeader}>
              <View>
                <Text style={styles.feedTitle}>Event Feed</Text>
                <Text style={styles.feedSubtitle}>
                  {events.length} event{events.length === 1 ? "" : "s"} in this seven-day window
                </Text>
              </View>
              <View style={[styles.feedAccentDot, { backgroundColor: accentColor }]} />
            </View>

            {fetchError ? (
              <View style={styles.emptyCard}>
                <Ionicons name="cloud-offline-outline" size={34} color={COLORS.accent} />
                <Text style={styles.emptyTitle}>Feed unavailable</Text>
                <Text style={styles.emptyText}>{fetchError}</Text>
                <Pressable style={styles.retryButton} onPress={() => fetchEvents(eventType, selectedDate)}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </Pressable>
              </View>
            ) : events.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="planet-outline" size={34} color={COLORS.accent} />
                <Text style={styles.emptyTitle}>No events in this window</Text>
                <Text style={styles.emptyText}>
                  Try a different end date or switch to another event type to explore the DONKI archive.
                </Text>
              </View>
            ) : (
              events.map((item) => (
                <EventCard key={item.storageKey} item={item} accentColor={accentColor} onToggleFavorite={toggleFavorite} />
              ))
            )}

            <Text style={styles.footerNote}>
              DONKI data is research-context space weather information from NASA CCMC.
            </Text>
          </ScrollView>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

export default DONKI;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#05070E",
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 36,
  },
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  loaderBadge: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  centerTitle: {
    marginTop: 18,
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
  },
  centerSubtitle: {
    marginTop: 8,
    color: COLORS.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 30,
    padding: 18,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  heroBadgeText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginLeft: 8,
  },
  heroTitle: {
    marginTop: 16,
    color: COLORS.textPrimary,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
  },
  heroSubtitle: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  dateButton: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  dateButtonText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    marginHorizontal: 8,
  },
  eventTypeRow: {
    paddingTop: 14,
  },
  eventTypeChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 10,
  },
  eventTypeChipActive: {
    backgroundColor: COLORS.accentSoft,
  },
  eventTypeText: {
    color: COLORS.textMuted,
    fontWeight: "700",
    marginLeft: 8,
  },
  eventTypeTextActive: {
    color: COLORS.textPrimary,
  },
  summaryRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginHorizontal: 4,
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  summaryValue: {
    marginTop: 8,
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "700",
  },
  feedHeader: {
    marginTop: 18,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feedTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "700",
  },
  feedSubtitle: {
    marginTop: 4,
    color: COLORS.textMuted,
    fontSize: 13,
  },
  feedAccentDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyCard: {
    marginTop: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 22,
    alignItems: "center",
  },
  emptyTitle: {
    marginTop: 14,
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyText: {
    marginTop: 8,
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 18,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  retryButtonText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  eventCard: {
    marginTop: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  eventTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  eventHeaderActions: {
    flex: 1,
    marginLeft: 14,
    alignItems: "flex-end",
  },
  eventMetricChip: {
    minWidth: 104,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eventMetricChipLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    letterSpacing: 1.1,
  },
  eventMetricChipValue: {
    marginTop: 6,
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  eventTimeWrap: {
    alignItems: "flex-end",
  },
  eventTimeLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    letterSpacing: 1.1,
  },
  eventTimeValue: {
    marginTop: 6,
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },
  eventSaveButton: {
    marginTop: 12,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  eventSaveButtonActive: {
    backgroundColor: "rgba(255,154,146,0.18)",
    borderColor: "rgba(255,154,146,0.28)",
  },
  eventTitle: {
    marginTop: 16,
    color: COLORS.textPrimary,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
  },
  eventDescription: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  eventMetaGrid: {
    marginTop: 14,
    flexDirection: "row",
  },
  eventMetaTile: {
    flex: 1,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  eventMetaLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    letterSpacing: 1.1,
  },
  eventMetaValue: {
    marginTop: 6,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  eventInstrumentText: {
    marginTop: 14,
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  linkButton: {
    marginTop: 16,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  linkButtonText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    marginRight: 8,
  },
  footerNote: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 20,
  },
});
