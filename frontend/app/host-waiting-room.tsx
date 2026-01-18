import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { NeoButton } from '@/components/ui/NeoButton';
import { NeoCounter } from '@/components/ui/NeoCounter';
import { Colors } from '@/constants/theme';

export default function HostWaitingRoomScreen() {
    const params = useLocalSearchParams<{
        nickname: string;
        roomPin?: string;
    }>();

    const nickname = params.nickname;
    const roomPin = params.roomPin || '4921'; // Use provided PIN or generate one

    const [rounds, setRounds] = useState(3);
    const [timer, setTimer] = useState(30);

    // Mock players list
    const players = [
        { id: '1', name: nickname || 'Host', isReady: true },
        { id: '2', name: 'Alice', isReady: true },
        { id: '3', name: 'Bob', isReady: false }, // Pending
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.roomCodeLabel}>ROOM PIN:</Text>
                    <Text style={styles.roomCode}>{roomPin}</Text>
                </View>

                {/* Game Settings - Host can change */}
                <View style={styles.settingsContainer}>
                    <View style={styles.settingRow}>
                        <NeoCounter
                            label="ROUNDS"
                            value={rounds}
                            onChange={setRounds}
                            min={3}
                            max={6}
                        />
                    </View>
                    <View style={styles.settingRow}>
                        <NeoCounter
                            label="TIMER"
                            value={timer}
                            onChange={setTimer}
                            min={15}
                            max={60}
                            step={15}
                            unit="sec"
                        />
                    </View>
                </View>

                {/* Player List */}
                <View style={styles.playerListContainer}>
                    <Text style={styles.playerListTitle}>PLAYERS ({players.length}/8)</Text>
                    <View style={styles.playersGrid}>
                        {players.map((player) => (
                            <View key={player.id} style={styles.playerChip}>
                                <Text style={styles.playerName}>{player.name}</Text>
                                {player.isReady ? (
                                    <Ionicons name="checkmark-circle" size={20} color="green" style={styles.readyIcon} />
                                ) : null}
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* Footer / Start Button */}
            <View style={styles.footer}>
                <NeoButton title="START GAME" onPress={() => { }} variant="primary" />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.neo.background,
    },
    content: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        width: '100%',
    },
    header: {
        marginBottom: 30,
        alignItems: 'center',
    },
    roomCodeLabel: {
        fontSize: 18,
        fontFamily: 'Nunito_700Bold',
        marginBottom: 5,
    },
    roomCode: {
        fontSize: 48,
        fontFamily: 'Nunito_700Bold',
    },
    settingsContainer: {
        width: '100%',
        marginBottom: 30,
        gap: 15,
    },
    settingRow: {
        height: 60,
    },
    playerListContainer: {
        width: '100%',
        marginBottom: 20,
    },
    playerListTitle: {
        fontSize: 18,
        fontFamily: 'Nunito_700Bold',
        marginBottom: 10,
        textAlign: 'left',
    },
    playersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    playerChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.neo.card,
        borderWidth: 2,
        borderColor: Colors.neo.border,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        shadowColor: Colors.neo.shadow,
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    playerName: {
        fontSize: 16,
        fontFamily: 'Nunito_600SemiBold',
        color: Colors.neo.text,
    },
    readyIcon: {
        marginLeft: 6,
    },
    footer: {
        padding: 20,
        paddingBottom: 40,
    },
});
