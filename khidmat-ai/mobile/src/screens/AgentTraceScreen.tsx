import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, ActivityIndicator } from 'react-native-paper';
import { useAppStore } from '../store/appStore';
import { colors } from '../constants/colors';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function AgentTraceScreen() {
  const store = useAppStore();
  const trace = store.agentTrace;

  const getColorForAgent = (agentName: string) => {
    switch (agentName) {
      case 'IntentAgent': return colors.brandPrimary; // blue
      case 'DiscoveryAgent': return '#9c27b0'; // purple
      case 'RankingAgent': return colors.brandWarning; // orange
      case 'DecisionAgent': return colors.brandSecondary; // green
      case 'BookingAgent': return '#009688'; // teal
      case 'FollowUpAgent': return colors.textSecondary; // grey
      default: return colors.brandPrimary;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {trace.map((step, index) => (
        <Animated.View key={index} entering={FadeInUp.delay(index * 200)}>
          <Card style={[styles.card, { borderLeftColor: getColorForAgent(step.agent_name) }]}>
            <Card.Content>
              <View style={styles.header}>
                <Text variant="titleMedium" style={{ color: getColorForAgent(step.agent_name), fontWeight: 'bold' }}>
                  {step.step_number}. {step.agent_name}
                </Text>
                <Text variant="bodySmall" style={{ color: colors.textSecondary }}>{step.duration_ms}ms</Text>
              </View>
              <Text variant="bodyMedium" style={styles.action}>Action: {step.action}</Text>
              <Text variant="bodySmall" style={styles.ioText} numberOfLines={2}>
                In: {typeof step.input === 'object' ? JSON.stringify(step.input) : step.input}
              </Text>
              <Text variant="bodySmall" style={styles.ioText} numberOfLines={2}>
                Out: {typeof step.output === 'object' ? JSON.stringify(step.output) : step.output}
              </Text>
            </Card.Content>
          </Card>
        </Animated.View>
      ))}

      {store.isProcessing && (
        <View style={styles.processing}>
          <ActivityIndicator color={colors.brandPrimary} />
          <Text style={{ marginLeft: 10 }}>Agent is thinking...</Text>
        </View>
      )}
      
      {!store.isProcessing && trace.length > 0 && (
        <Text style={styles.totalDuration}>
          Total Pipeline Duration: {trace.reduce((acc, step) => acc + step.duration_ms, 0)}ms
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBg },
  content: { padding: 16 },
  card: { marginBottom: 12, borderLeftWidth: 4, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  action: { fontWeight: '600', marginBottom: 8, color: colors.textPrimary },
  ioText: { color: colors.textSecondary, marginBottom: 4, fontFamily: 'monospace' },
  processing: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  totalDuration: { textAlign: 'center', marginTop: 20, fontWeight: 'bold', color: colors.brandPrimary }
});
