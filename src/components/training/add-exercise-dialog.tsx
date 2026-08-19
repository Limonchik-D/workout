'use client';

import { useState, useCallback } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { EXERCISE_CATEGORIES } from '@/types/domain';
import type { Exercise, ExerciseCategory } from '@/types/domain';
import { searchExercises, createExercise } from '@/lib/db/repositories/exercises';
import { validateExerciseName } from '@/lib/validation';
import { cn } from '@/lib/utils';

interface AddExerciseDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

export function AddExerciseDialog({ open, onClose, onSelect }: AddExerciseDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Exercise[]>([]);
  const [searched, setSearched] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExerciseCategory>('chest');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    const found = await searchExercises(q);
    setResults(found);
    setSearched(true);
  }, []);

  const handleSelect = useCallback(
    (exercise: Exercise) => {
      onSelect(exercise);
      onClose();
      setQuery('');
      setResults([]);
      setSearched(false);
      setShowCreate(false);
    },
    [onSelect, onClose]
  );

  const handleCreate = useCallback(async () => {
    const err = validateExerciseName(name);
    if (err) {
      setNameError(err);
      return;
    }
    setCreating(true);
    try {
      const exercise = await createExercise({ name, category, description: description || undefined });
      handleSelect(exercise);
      setName('');
      setCategory('chest');
      setDescription('');
    } finally {
      setCreating(false);
    }
  }, [name, category, description, handleSelect]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setQuery('');
      setResults([]);
      setSearched(false);
      setShowCreate(false);
      setName('');
      setNameError('');
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>{showCreate ? 'Новое упражнение' : 'Добавить упражнение'}</DialogTitle>
        </DialogHeader>

        {!showCreate ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 bg-secondary/40 border-border"
                placeholder="Жим лёжа, приседания..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
              />
            </div>

            {searched && (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {results.length > 0 ? (
                  results.map((ex) => (
                    <button
                      key={ex.id}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-secondary/60 transition-colors text-left"
                      onClick={() => handleSelect(ex)}
                    >
                      <span className="font-medium text-sm">{ex.name}</span>
                      <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                        {EXERCISE_CATEGORIES.find((c) => c.value === ex.category)?.label}
                      </Badge>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    <p>Упражнение не найдено</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        setShowCreate(true);
                        setName(query);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Создать «{query}»
                    </Button>
                  </div>
                )}
              </div>
            )}

            {!searched && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowCreate(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Создать новое упражнение
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ex-name">Название *</Label>
              <Input
                id="ex-name"
                value={name}
                onChange={(e) => { setName(e.target.value); setNameError(''); }}
                placeholder="Жим лёжа"
                className={cn('bg-secondary/40', nameError && 'border-destructive')}
                autoFocus
              />
              {nameError && <p className="text-xs text-destructive">{nameError}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ex-category">Категория *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ExerciseCategory)}>
                <SelectTrigger id="ex-category" className="bg-secondary/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXERCISE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ex-desc">Описание (необязательно)</Label>
              <Textarea
                id="ex-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Заметки по технике..."
                rows={2}
                className="bg-secondary/40 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>
                Назад
              </Button>
              <Button className="flex-1" onClick={handleCreate} disabled={creating}>
                {creating ? 'Создание...' : 'Создать'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
