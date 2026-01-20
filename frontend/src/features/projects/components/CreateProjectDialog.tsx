import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { projectApi } from '../../../lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useFormWithValidation } from '../../../hooks/useFormWithValidation';
import { projectSchema, ProjectFormValues } from '../../../lib/validation';

interface CreateProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const CreateProjectDialog = ({ open, onOpenChange }: CreateProjectDialogProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useFormWithValidation<ProjectFormValues>({
        schema: projectSchema,
        defaultValues: {
            name: '',
            type: 'story',
            resolution: { width: 1920, height: 1080 },
            fps: 24,
        },
    });

    const selectedType = watch('type');

    const onSubmit = async (data: ProjectFormValues) => {
        setLoading(true);
        try {
            const newProject = await projectApi.create(data);
            // 刷新项目列表缓存
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            onOpenChange(false);
            navigate(`/project/${newProject.id}`);
        } catch (error) {
            console.error('Failed to create project', error);
            // 这里可以添加更友好的错误提示，例如使用 toast
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
                    <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                        <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">{t('projects.create_dialog.title')}</Dialog.Title>
                        <Dialog.Description className="text-sm text-muted-foreground">
                            {t('projects.create_dialog.description')}
                        </Dialog.Description>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {t('projects.create_dialog.name_label')}
                            </label>
                            <input
                                id="name"
                                {...register('name')}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder={t('projects.create_dialog.name_placeholder')}
                                required
                            />
                            {errors.name && (
                                <p className="text-xs text-destructive">
                                    {t(errors.name.message as string, { min: 2, max: 50 })}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="type" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {t('projects.create_dialog.type_label')}
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['story', 'animation', 'short'] as const).map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setValue('type', type)}
                                        className={`
                      flex items-center justify-center px-3 py-2 text-sm rounded-md border transition-all
                      ${selectedType === type
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-card hover:bg-accent hover:text-accent-foreground border-input'}
                    `}
                                    >
                                        <span className="capitalize">{t(`projects.types.${type}`)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground rounded-md"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 rounded-md flex items-center gap-2"
                            >
                                {loading ? t('common.creating') : t('common.create')}
                            </button>
                        </div>
                    </form>

                    <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                        <X className="h-4 w-4" />
                        <span className="sr-only">{t('common.close')}</span>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};
