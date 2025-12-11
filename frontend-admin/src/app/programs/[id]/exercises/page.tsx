'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, GripVertical, Save } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { WorkoutProgram, ProgramExercise, Exercise } from '@/types/api';
import { useToast } from '@/contexts/ToastContext';
import { Button, Card, Modal, Select, Input } from '@/components/ui';

interface ExerciseFormData {
  exerciseId: string;
  sets: number;
  reps: string;
  restTimeSeconds: number;
  notes: string;
}

export default function ProgramExercisesPage() {
  const router = useRouter();
  const params = useParams();
  const programId = params.id as string;
  const toast = useToast();

  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [programExercises, setProgramExercises] = useState<ProgramExercise[]>([]);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<ExerciseFormData>({
    exerciseId: '',
    sets: 3,
    reps: '10-12',
    restTimeSeconds: 60,
    notes: '',
  });

  useEffect(() => {
    fetchProgramDetails();
    fetchProgramExercises();
    fetchAvailableExercises();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId]);

  const fetchProgramDetails = useCallback(async () => {
    try {
      const response = await apiClient.getProgram(programId);
      if (response.data) {
        setProgram(response.data);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Program yüklenirken hata oluştu';
      toast.error(message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId]);

  const fetchProgramExercises = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getProgramExercises(programId);
      if (response.data) {
        setProgramExercises(response.data);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Egzersizler yüklenirken hata oluştu';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId]);

  const fetchAvailableExercises = useCallback(async () => {
    try {
      const response = await apiClient.getExercises({ page: 1, limit: 100 });
      if (response.data) {
        setAvailableExercises(response.data.items);
      }
    } catch (error: unknown) {
      console.error('Egzersizler yüklenirken hata oluştu:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenModal = () => {
    setFormData({
      exerciseId: '',
      sets: 3,
      reps: '10-12',
      restTimeSeconds: 60,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiClient.addExerciseToProgram(programId, {
        exerciseId: formData.exerciseId,
        orderIndex: programExercises.length,
        sets: formData.sets,
        reps: formData.reps,
        restTimeSeconds: formData.restTimeSeconds,
        notes: formData.notes || undefined,
      });
      toast.success('Egzersiz programa eklendi');
      await fetchProgramExercises();
      handleCloseModal();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Ekleme sırasında hata oluştu';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (exerciseId: string) => {
    if (!confirm('Bu egzersizi programdan çıkarmak istediğinize emin misiniz?')) return;

    try {
      await apiClient.removeExerciseFromProgram(programId, exerciseId);
      toast.success('Egzersiz programdan çıkarıldı');
      fetchProgramExercises();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Silme işlemi sırasında hata oluştu';
      toast.error(message);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/programs')}
            leftIcon={<ArrowLeft size={20} />}
          >
            Geri
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {program?.name || 'Program Egzersizleri'}
            </h1>
            <p className="text-gray-600 mt-1">Program içindeki egzersizleri yönetin</p>
          </div>
        </div>
        <Button onClick={handleOpenModal} leftIcon={<Plus size={20} />}>
          Egzersiz Ekle
        </Button>
      </div>

      {/* Program Info */}
      {program && (
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Zorluk Seviyesi</p>
              <p className="font-semibold">{program.difficultyLevel}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Toplam Egzersiz</p>
              <p className="font-semibold">{programExercises.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Atanan Öğrenci</p>
              <p className="font-semibold">
                {program.assignedUser
                  ? `${program.assignedUser.firstName} ${program.assignedUser.lastName}`
                  : 'Genel Program'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Exercises List */}
      <Card>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Yükleniyor...</p>
          </div>
        ) : programExercises.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Henüz egzersiz eklenmemiş</p>
            <Button onClick={handleOpenModal} className="mt-4" leftIcon={<Plus size={20} />}>
              İlk Egzersizi Ekle
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {programExercises.map((pe, index) => (
              <div
                key={pe.id}
                className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 text-gray-400">
                  <GripVertical size={20} />
                  <span className="font-semibold text-lg">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{pe.exercise?.name || 'Egzersiz'}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span>
                      <strong>Sets:</strong> {pe.sets}
                    </span>
                    <span>
                      <strong>Reps:</strong> {pe.reps}
                    </span>
                    <span>
                      <strong>Dinlenme:</strong> {pe.restTimeSeconds}s
                    </span>
                  </div>
                  {pe.notes && (
                    <p className="text-sm text-gray-500 mt-1">
                      <strong>Not:</strong> {pe.notes}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(pe.id)}
                  leftIcon={<Trash2 size={16} />}
                >
                  Çıkar
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Exercise Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Egzersiz Ekle"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={handleCloseModal}>
              İptal
            </Button>
            <Button onClick={handleSubmit} isLoading={isSubmitting} leftIcon={<Save size={20} />}>
              Ekle
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {availableExercises.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <p>Egzersiz listesi yükleniyor veya hiç egzersiz yok...</p>
              <p className="text-sm mt-2">Önce egzersiz eklemeniz gerekebilir.</p>
            </div>
          ) : (
            <Select
              label="Egzersiz"
              value={formData.exerciseId}
              onChange={(e) => setFormData({ ...formData, exerciseId: e.target.value })}
              required
              options={[
                { value: '', label: 'Egzersiz seçin...' },
                ...(availableExercises || []).map((ex) => ({
                  value: ex.id,
                  label: `${ex.name} (${ex.targetMuscleGroup})`,
                })),
              ]}
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Set Sayısı"
              type="number"
              min="1"
              value={formData.sets}
              onChange={(e) => setFormData({ ...formData, sets: parseInt(e.target.value) })}
              required
            />
            <Input
              label="Tekrar (örn: 10-12)"
              value={formData.reps}
              onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
              required
              placeholder="8-10"
            />
          </div>
          <Input
            label="Dinlenme Süresi (saniye)"
            type="number"
            min="0"
            value={formData.restTimeSeconds}
            onChange={(e) => setFormData({ ...formData, restTimeSeconds: parseInt(e.target.value) })}
            required
          />
          <Input
            label="Notlar (Opsiyonel)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Özel notlar..."
          />
        </form>
      </Modal>
    </div>
  );
}
