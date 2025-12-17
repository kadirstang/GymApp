import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/api';
import { WorkoutProgram } from '@/types/api';

interface SetData {
  reps: number;
  weight: number;
  completed: boolean;
}

interface ExerciseWorkoutData {
  exerciseId: string;
  sets: SetData[];
}

export default function ActiveWorkoutScreen() {
  const { user } = useAuth();
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [workoutData, setWorkoutData] = useState<ExerciseWorkoutData[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);

  useEffect(() => {
    loadProgram();

    // Elapsed time ticker
    const interval = setInterval(() => {
      const elapsed = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Rest timer countdown
  useEffect(() => {
    if (!showRestTimer || restTimeRemaining <= 0) return;

    const timer = setInterval(() => {
      setRestTimeRemaining((prev) => {
        if (prev <= 1) {
          setShowRestTimer(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showRestTimer, restTimeRemaining]);

  const loadProgram = async () => {
    try {
      if (!user) return;

      const response = await apiClient.getAssignedProgram(user.id);
      const items = response.data.items || [];
      const programData = items.length > 0 ? items[0] : null;

      setProgram(programData);

      // Initialize workout data with all sets empty
      if (programData && programData.programExercises) {
        const initialData: ExerciseWorkoutData[] = programData.programExercises.map((pe: any) => ({
          exerciseId: pe.exercise.id,
          sets: Array.from({ length: pe.sets }, () => ({
            reps: 0,
            weight: 0,
            completed: false,
          })),
        }));
        setWorkoutData(initialData);
      }
    } catch (error) {
      console.error('Failed to load program:', error);
      Alert.alert('Error', 'Failed to load workout program');
    } finally {
      setLoading(false);
    }
  };

  const completeCurrentSet = () => {
    const currentSet = workoutData[currentExerciseIndex].sets[currentSetIndex];

    if (currentSet.reps === 0 || currentSet.weight === 0) {
      Alert.alert('Incomplete Data', 'Please enter reps and weight before completing the set.');
      return;
    }

    // Mark set as completed
    setWorkoutData((prev) => {
      const newData = [...prev];
      newData[currentExerciseIndex].sets[currentSetIndex].completed = true;
      return newData;
    });

    const currentExercise = program?.programExercises[currentExerciseIndex];
    const restSeconds = currentExercise?.restSeconds || 60;

    // Check if this is the last set of the current exercise
    const isLastSetInExercise = currentSetIndex === workoutData[currentExerciseIndex].sets.length - 1;
    const isLastExercise = currentExerciseIndex === workoutData.length - 1;

    // If not the last set overall, show rest timer
    if (!isLastSetInExercise || !isLastExercise) {
      setRestTimeRemaining(restSeconds);
      setShowRestTimer(true);

      // Auto-advance after a brief delay
      setTimeout(() => {
        if (isLastSetInExercise) {
          // Move to next exercise
          if (!isLastExercise) {
            setCurrentExerciseIndex(currentExerciseIndex + 1);
            setCurrentSetIndex(0);
          }
        } else {
          // Move to next set
          setCurrentSetIndex(currentSetIndex + 1);
        }
      }, 500);
    }
  };

  const skipRest = () => {
    setShowRestTimer(false);
    setRestTimeRemaining(0);
  };

  const updateCurrentSet = (field: 'reps' | 'weight', value: string) => {
    const numValue = parseInt(value) || 0;
    setWorkoutData((prev) => {
      const newData = [...prev];
      newData[currentExerciseIndex].sets[currentSetIndex][field] = numValue;
      return newData;
    });
  };

  const getTotalProgress = () => {
    const totalSets = workoutData.reduce((sum, ex) => sum + ex.sets.length, 0);
    const completedSets = workoutData.reduce(
      (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
      0
    );
    return { totalSets, completedSets };
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };


  const handleFinishWorkout = async () => {
    const { totalSets, completedSets } = getTotalProgress();

    // Validation: check if all sets completed
    if (completedSets < totalSets) {
      Alert.alert(
        'Incomplete Workout',
        `You have completed ${completedSets} out of ${totalSets} sets.\n\nDo you want to finish anyway?`,
        [
          { text: 'Continue Workout', style: 'cancel' },
          {
            text: 'Finish Anyway',
            style: 'destructive',
            onPress: saveWorkout,
          },
        ]
      );
    } else {
      saveWorkout();
    }
  };

  const saveWorkout = async () => {
    try {
      const duration = Math.floor((new Date().getTime() - startTime.getTime()) / 1000 / 60);
      const { totalSets, completedSets } = getTotalProgress();

      // Calculate total weight lifted
      const totalWeight = workoutData.reduce((sum, ex) => {
        return sum + ex.sets.reduce((setSum, set) => {
          return set.completed ? setSum + set.weight * set.reps : setSum;
        }, 0);
      }, 0);

      await apiClient.createWorkoutLog({
        programId: program!.id,
        duration,
        exercises: workoutData,
        notes: `Completed ${completedSets}/${totalSets} sets | Total weight: ${totalWeight}kg`,
      });

      // Success screen
      Alert.alert(
        'Workout Complete! 🎉',
        `Duration: ${duration} minutes\nSets: ${completedSets}/${totalSets}\nTotal Weight: ${totalWeight}kg`,
        [{ text: 'OK', onPress: () => {} }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save workout');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!program || !program.programExercises || program.programExercises.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No program assigned</Text>
      </View>
    );
  }

  const currentExercise = program.programExercises[currentExerciseIndex];
  const currentSet = workoutData[currentExerciseIndex]?.sets[currentSetIndex];
  const { totalSets, completedSets } = getTotalProgress();
  const progressPercentage = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Progress Header */}
      <View style={styles.progressHeader}>
        <View style={styles.progressHeaderRow}>
          <Text style={styles.progressText}>
            Exercise {currentExerciseIndex + 1}/{program.programExercises.length} - Set{' '}
            {currentSetIndex + 1}/{workoutData[currentExerciseIndex]?.sets.length || 0}
          </Text>
          <Text style={styles.elapsedTime}>{formatTime(elapsedTime)}</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
        </View>
        <Text style={styles.progressSubtext}>
          {completedSets}/{totalSets} sets completed
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Current Exercise */}
        <View style={styles.currentExerciseCard}>
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>CURRENT</Text>
          </View>
          <Text style={styles.currentExerciseName}>{currentExercise?.exercise.name}</Text>

          {/* Current Set Inputs */}
          {currentSet && !currentSet.completed && (
            <View style={styles.currentSetInputs}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reps</Text>
                <TextInput
                  style={styles.largeInput}
                  placeholder="0"
                  keyboardType="numeric"
                  value={currentSet.reps > 0 ? currentSet.reps.toString() : ''}
                  onChangeText={(value) => updateCurrentSet('reps', value)}
                />
              </View>
              <Text style={styles.inputSeparator}>×</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.largeInput}
                  placeholder="0"
                  keyboardType="numeric"
                  value={currentSet.weight > 0 ? currentSet.weight.toString() : ''}
                  onChangeText={(value) => updateCurrentSet('weight', value)}
                />
              </View>
            </View>
          )}

          {/* Complete Set Button */}
          <TouchableOpacity
            style={[
              styles.completeSetButton,
              currentSet?.completed && styles.completeSetButtonCompleted,
            ]}
            onPress={completeCurrentSet}
            disabled={currentSet?.completed}
          >
            <Ionicons
              name={currentSet?.completed ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={24}
              color="#fff"
            />
            <Text style={styles.completeSetButtonText}>
              {currentSet?.completed ? 'Set Completed' : 'Complete Set'}
            </Text>
          </TouchableOpacity>

          {/* Set History (Completed Sets) */}
          {workoutData[currentExerciseIndex]?.sets.some((s) => s.completed) && (
            <View style={styles.setHistory}>
              <Text style={styles.setHistoryTitle}>Completed Sets:</Text>
              {workoutData[currentExerciseIndex].sets.map((set, idx) => {
                if (!set.completed && idx !== currentSetIndex) return null;
                const isCurrent = idx === currentSetIndex;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.historySetRow,
                      isCurrent && styles.historySetRowCurrent,
                      set.completed && styles.historySetRowCompleted,
                    ]}
                  >
                    <Ionicons
                      name={set.completed ? 'checkmark-circle' : 'ellipse-outline'}
                      size={16}
                      color={set.completed ? '#10b981' : '#3b82f6'}
                    />
                    <Text style={styles.historySetText}>
                      Set {idx + 1}: {set.reps} reps × {set.weight}kg
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Upcoming Exercises */}
        {program.programExercises.map((pe: any, idx: number) => {
          if (idx <= currentExerciseIndex) return null; // Skip current and completed
          const isLocked = idx > currentExerciseIndex;
          return (
            <View
              key={pe.id}
              style={[styles.upcomingExerciseCard, isLocked && styles.lockedExerciseCard]}
            >
              <View style={styles.exerciseHeaderRow}>
                {isLocked && <Ionicons name="lock-closed" size={20} color="#9ca3af" />}
                <Text style={[styles.upcomingExerciseName, isLocked && styles.lockedText]}>
                  {idx + 1}. {pe.exercise.name}
                </Text>
              </View>
              <Text style={[styles.upcomingExerciseInfo, isLocked && styles.lockedText]}>
                {pe.sets} sets × {pe.reps_min}-{pe.reps_max} reps
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Finish Workout Button */}
      <TouchableOpacity style={styles.finishButton} onPress={handleFinishWorkout}>
        <Text style={styles.finishButtonText}>Finish Workout</Text>
      </TouchableOpacity>

      {/* Rest Timer Modal */}
      <Modal visible={showRestTimer} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.restModal}>
            <Ionicons name="time" size={48} color="#3b82f6" />
            <Text style={styles.restTitle}>Rest Time</Text>
            <Text style={styles.restTime}>{formatTime(restTimeRemaining)}</Text>
            <TouchableOpacity style={styles.skipRestButton} onPress={skipRest}>
              <Text style={styles.skipRestButtonText}>Skip Rest</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
  progressHeader: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  elapsedTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  progressSubtext: {
    fontSize: 12,
    color: '#6b7280',
  },
  content: {
    flex: 1,
  },
  currentExerciseCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  currentExerciseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  currentSetInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  inputGroup: {
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  largeInput: {
    width: 100,
    height: 60,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1f2937',
  },
  inputSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 20,
  },
  completeSetButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  completeSetButtonCompleted: {
    backgroundColor: '#9ca3af',
  },
  completeSetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  setHistory: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  setHistoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  historySetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  historySetRowCurrent: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  historySetRowCompleted: {
    opacity: 0.7,
  },
  historySetText: {
    fontSize: 14,
    color: '#1f2937',
  },
  upcomingExerciseCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  lockedExerciseCard: {
    opacity: 0.5,
  },
  exerciseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  upcomingExerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  upcomingExerciseInfo: {
    fontSize: 14,
    color: '#6b7280',
  },
  lockedText: {
    color: '#9ca3af',
  },
  finishButton: {
    backgroundColor: '#ef4444',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    minWidth: 280,
  },
  restTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  restTime: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 24,
  },
  skipRestButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  skipRestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
});
