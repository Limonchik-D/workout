'use client';

import { useState, useRef } from 'react';
import { Settings, User, Timer, Palette, Database, Dumbbell, AlertTriangle, Download, Upload, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSettings } from '@/hooks/use-settings';
import { useExercises } from '@/hooks/use-exercises';
import { exportBackup, downloadBackup, parseBackupFile, importBackup } from '@/lib/backup';
import { clearAllData } from '@/lib/db/repositories/settings';
import { EXERCISE_CATEGORIES } from '@/types/domain';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const { exercises, archive, restore } = useExercises();

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<ReturnType<typeof parseBackupFile> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!settings) return null;

  const handleExport = async () => {
    try {
      const data = await exportBackup();
      downloadBackup(data);
      toast.success('Резервная копия сохранена');
    } catch {
      toast.error('Ошибка экспорта');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = parseBackupFile(text);
      setPendingBackup(data);
      setShowImportDialog(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка чтения файла');
    }
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!pendingBackup) return;
    try {
      await importBackup(pendingBackup, importMode);
      setShowImportDialog(false);
      setPendingBackup(null);
      toast.success('Данные импортированы');
    } catch {
      toast.error('Ошибка импорта');
    }
  };

  const handleDeleteAll = async () => {
    if (deleteConfirm !== 'DELETE') return;
    await clearAllData();
    setShowDeleteDialog(false);
    setDeleteConfirm('');
    toast.success('Все данные удалены');
  };

  const activeExercises = exercises.filter((e) => e.status === 'active');
  const archivedExercises = exercises.filter((e) => e.status === 'archived');

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto w-full px-4 py-5 space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Настройки</h1>
        </div>

        {/* Profile */}
        <Section icon={<User className="h-4 w-4" />} title="Профиль">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Имя (необязательно)</Label>
              <Input
                value={settings.displayName ?? ''}
                onChange={(e) => updateSettings({ displayName: e.target.value || undefined })}
                placeholder="Ваше имя"
                className="bg-secondary/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Единицы веса</Label>
              <Select
                value={settings.weightUnit}
                onValueChange={(v) => updateSettings({ weightUnit: v as 'kg' | 'lb' })}
              >
                <SelectTrigger className="bg-secondary/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">кг (килограммы)</SelectItem>
                  <SelectItem value="lb">lb (фунты)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Section>

        <Separator className="opacity-20" />

        {/* Timer */}
        <Section icon={<Timer className="h-4 w-4" />} title="Таймер отдыха">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Стандартное время отдыха</Label>
              <Select
                value={String(settings.defaultRestSeconds)}
                onValueChange={(v) => updateSettings({ defaultRestSeconds: Number(v) })}
              >
                <SelectTrigger className="bg-secondary/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[30, 60, 90, 120, 180, 240, 300].map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s < 60 ? `${s} секунд` : `${s / 60} минут${s / 60 > 1 ? 'ы' : 'а'}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ToggleRow
              label="Звук завершения"
              value={settings.timerSoundEnabled}
              onChange={(v) => updateSettings({ timerSoundEnabled: v })}
            />
          </div>
        </Section>

        <Separator className="opacity-20" />

        {/* Appearance */}
        <Section icon={<Palette className="h-4 w-4" />} title="Внешний вид">
          <ToggleRow
            label="Анимации"
            value={settings.animationsEnabled}
            onChange={(v) => updateSettings({ animationsEnabled: v })}
          />
        </Section>

        <Separator className="opacity-20" />

        {/* Exercises */}
        <Section icon={<Dumbbell className="h-4 w-4" />} title="Упражнения">
          <div className="space-y-2">
            {activeExercises.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground px-1">Активные ({activeExercises.length})</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {activeExercises.map((ex) => (
                    <div key={ex.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/20">
                      <div>
                        <span className="text-sm font-medium">{ex.name}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {EXERCISE_CATEGORIES.find((c) => c.value === ex.category)?.label}
                        </Badge>
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={() => archive(ex.id)}>
                        Архив
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {archivedExercises.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground px-1">Архив ({archivedExercises.length})</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {archivedExercises.map((ex) => (
                    <div key={ex.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/10 opacity-70">
                      <div>
                        <span className="text-sm">{ex.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {EXERCISE_CATEGORIES.find((c) => c.value === ex.category)?.label}
                        </Badge>
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-primary" onClick={() => restore(ex.id)}>
                        Восстановить
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {exercises.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Упражнения появятся здесь после добавления
              </p>
            )}
          </div>
        </Section>

        <Separator className="opacity-20" />

        {/* Data / Backup */}
        <Section icon={<Database className="h-4 w-4" />} title="Данные">
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Экспортировать резервную копию
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Импортировать резервную копию
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,.workout.json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </Section>

        <Separator className="opacity-20" />

        {/* Danger zone */}
        <Section icon={<AlertTriangle className="h-4 w-4 text-destructive" />} title="Опасная зона">
          <Button
            variant="outline"
            className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            Удалить все данные
          </Button>
        </Section>

        <div className="h-4" />
      </div>

      {/* Import dialog */}
      <Dialog open={showImportDialog} onOpenChange={(o) => !o && setShowImportDialog(false)}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle>Импорт данных</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Файл содержит {pendingBackup?.workouts.length ?? 0} тренировок и{' '}
              {pendingBackup?.exercises.length ?? 0} упражнений.
            </p>
            <div className="space-y-2">
              <button
                className={cn('w-full p-3 rounded-xl border text-left transition-colors', importMode === 'merge' ? 'border-primary bg-primary/10' : 'border-border')}
                onClick={() => setImportMode('merge')}
              >
                <p className="text-sm font-medium">Добавить к существующим</p>
                <p className="text-xs text-muted-foreground mt-0.5">Дубликаты будут пропущены по ID</p>
              </button>
              <button
                className={cn('w-full p-3 rounded-xl border text-left transition-colors', importMode === 'replace' ? 'border-destructive bg-destructive/10' : 'border-border')}
                onClick={() => setImportMode('replace')}
              >
                <p className="text-sm font-medium">Заменить локальные данные</p>
                <p className="text-xs text-muted-foreground mt-0.5">Все текущие данные будут удалены</p>
              </button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowImportDialog(false)}>Отмена</Button>
              <Button className="flex-1" onClick={handleImport}>Импортировать</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete all dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={(o) => !o && setShowDeleteDialog(false)}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive">Удалить все данные?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Это действие необратимо. Будут удалены все тренировки, упражнения и настройки.
            </p>
            <div className="space-y-1.5">
              <Label>Введите DELETE для подтверждения</Label>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="bg-secondary/30 font-mono"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowDeleteDialog(false)}>Отмена</Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={deleteConfirm !== 'DELETE'}
                onClick={handleDeleteAll}
              >
                Удалить всё
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-sm">{label}</span>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors duration-200',
          value ? 'bg-primary' : 'bg-secondary'
        )}
      >
        <span
          className={cn(
            'absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
            value && 'translate-x-5'
          )}
        />
      </button>
    </div>
  );
}
