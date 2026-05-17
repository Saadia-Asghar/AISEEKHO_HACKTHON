import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip, ProgressBar, Modal, Portal } from 'react-native-paper';
import { useAppStore } from '../store/appStore';
import { api } from '../services/api';
import { colors } from '../constants/colors';

export default function ProviderResultsScreen() {
  const store = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProviderDetails, setSelectedProviderDetails] = useState<any>(null);

  const fetchProviders = async () => {
    setRefreshing(true);
    try {
      // In a real app, we might get these from the state or API. 
      // For this demo, let's fetch all providers.
      const providers = await api.getProviders();
      // Mock ranking for display purposes if not coming from pipeline
      store.setProviders(providers);
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (store.providers.length === 0) {
      fetchProviders();
    }
  }, []);

  const onRefresh = React.useCallback(() => {
    fetchProviders();
  }, []);

  const providersToDisplay = store.providers.length > 0 ? store.providers : [];

  const handleCardPress = (provider: any) => {
    setSelectedProviderDetails(provider);
    setModalVisible(true);
  };

  if (providersToDisplay.length === 0 && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: colors.textSecondary }}>No providers found nearby. Try a different area or service.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {providersToDisplay.map((provider: any, index: number) => {
          const isRank1 = index === 0 && provider.match_score;
          const availabilityColor = provider.is_available ? colors.brandSecondary : colors.textSecondary;
          
          return (
            <Card key={provider.provider_id || index} style={styles.card} onPress={() => handleCardPress(provider)}>
              <Card.Content>
                <View style={styles.rowBetween}>
                  <Text variant="titleMedium" style={styles.title}>{provider.name}</Text>
                  {isRank1 && <Chip icon="star" style={styles.bestMatchChip} textStyle={{color: '#fff'}}>Best Match</Chip>}
                </View>
                
                <View style={styles.tagsRow}>
                  <Chip compact style={styles.serviceTag}>{provider.service_categories?.[0]}</Chip>
                  <Text style={{ color: colors.brandWarning, fontWeight: 'bold' }}> {provider.rating}★</Text>
                  <Text style={{ color: colors.textSecondary }}> • {provider.distance_km || '?'}km</Text>
                </View>

                <View style={styles.rowBetween}>
                  <Text style={{ color: availabilityColor, fontWeight: 'bold' }}>
                    {provider.is_available ? "Available" : "Busy"}
                  </Text>
                  <Chip compact mode="outlined" style={styles.priceTag}>{provider.price_tier}</Chip>
                </View>

                {provider.match_score && (
                  <View style={styles.scoreContainer}>
                    <Text variant="bodySmall" style={{ color: colors.textSecondary, marginBottom: 4 }}>Match Score: {provider.match_score}</Text>
                    <ProgressBar progress={provider.match_score} color={colors.brandPrimary} />
                  </View>
                )}
              </Card.Content>
              <Card.Actions>
                <Button 
                  mode="contained" 
                  buttonColor={colors.brandPrimary}
                  disabled={!provider.is_available}
                  onPress={() => console.log('Book provider from UI not fully implemented here')}
                >
                  Book This Provider
                </Button>
              </Card.Actions>
            </Card>
          );
        })}
      </ScrollView>

      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modalContent}>
          {selectedProviderDetails && (
            <View>
              <Text variant="headlineSmall" style={styles.modalTitle}>{selectedProviderDetails.name}</Text>
              <Text style={styles.modalText}>Service: {selectedProviderDetails.service_categories?.join(', ')}</Text>
              <Text style={styles.modalText}>Location: {selectedProviderDetails.location?.area}</Text>
              <Text style={styles.modalText}>Experience: {selectedProviderDetails.experience_years} years</Text>
              <Text style={styles.modalText}>Phone: {selectedProviderDetails.phone}</Text>
              <Button mode="contained" onPress={() => setModalVisible(false)} style={{marginTop: 20}}>Close</Button>
            </View>
          )}
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBg },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { padding: 16 },
  card: { marginBottom: 16, backgroundColor: '#fff' },
  title: { fontWeight: 'bold', color: colors.textPrimary },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bestMatchChip: { backgroundColor: colors.brandWarning },
  tagsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  serviceTag: { backgroundColor: '#e3f2fd', marginRight: 8 },
  priceTag: { borderColor: colors.textSecondary },
  scoreContainer: { marginTop: 12 },
  modalContent: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 8 },
  modalTitle: { fontWeight: 'bold', marginBottom: 10 },
  modalText: { marginBottom: 5, fontSize: 16 }
});
