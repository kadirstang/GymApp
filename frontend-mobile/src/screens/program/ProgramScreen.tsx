import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/api';
import { WorkoutProgram } from '@/types/api';
import { useNavigation } from '@react-navigation/native';

export default function ProgramScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProgram = async () => {
    if (!user) return;

    try {
      const response = await apiClient.getAssignedProgram(user.id);
      if (response.success && response.data) {
        // API returns paginated data with items array
        const items = response.data.items || [];
        const programData = items.length > 0 ? items[0] : null;
        setProgram(programData);
      }
    } catch (error) {
      console.error('Failed to fetch program:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProgram();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProgram();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!program) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Program Assigned</Text>
          <Text style={styles.emptyText}>
            Your trainer hasn't assigned you a workout program yet.
          </Text>
          <Text style={styles.emptyHint}>
            Pull down to refresh or contact your trainer.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.programName}>{program.name}</Text>
        {program.description && (
          <Text style={styles.programDescription}>{program.description}</Text>
        )}
        {program.difficultyLevel && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {program.difficultyLevel.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exercises</Text>
        {program.programExercises?.length > 0 ? (
          program.programExercises.map((programExercise, index) => (
          <View key={programExercise.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseNumber}>{index + 1}</Text>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>
                  {programExercise.exercise.name}
                </Text>
                {programExercise.exercise.description && (
                  <Text style={styles.exerciseDescription}>
                    {programExercise.exercise.description}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.exerciseDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Sets</Text>
                <Text style={styles.detailValue}>{programExercise.sets}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Reps</Text>
                <Text style={styles.detailValue}>
                  {programExercise.repsMin}
                  {programExercise.repsMax && ` - ${programExercise.repsMax}`}
                </Text>
              </View>
              {programExercise.restSeconds && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Rest</Text>
                  <Text style={styles.detailValue}>
                    {programExercise.restSeconds}s
                  </Text>
                </View>
              )}
            </View>
            {programExercise.notes && (
              <Text style={styles.exerciseNotes}>
                Note: {programExercise.notes}
              </Text>
            )}
          </View>
        ))
        ) : (
          <Text style={styles.emptyText}>No exercises in this program</Text>
        )}
      </View>

      {program.programExercises && program.programExercises.length > 0 && (
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate('ActiveWorkout' as never)}
        >
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  programName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  programDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  exerciseCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    backgroundColor: '#3b82f6',
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  exerciseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  exerciseNotes: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  startButton: {
    backgroundColor: '#3b82f6',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
