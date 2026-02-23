import { useRef } from 'react';
import type { OnboardingPhoto } from '../../types/database.types';

interface StepPhotoProps {
    data: OnboardingPhoto;
    onChange: (updates: Partial<OnboardingPhoto>) => void;
}

export default function StepPhoto({ data, onChange }: StepPhotoProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File | undefined) => {
        if (!file) return;

        // Validate type
        if (!file.type.startsWith('image/')) return;

        // Validate size (5MB max)
        if (file.size > 5 * 1024 * 1024) return;

        const previewUrl = URL.createObjectURL(file);
        onChange({ file, previewUrl });
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        handleFile(e.dataTransfer.files[0]);
    };

    const handleRemove = () => {
        if (data.previewUrl) URL.revokeObjectURL(data.previewUrl);
        onChange({ file: null, previewUrl: null });
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <>
            <div className="step-header">
                <h2 className="step-title">Profile photo</h2>
                <p className="step-description">
                    Add a photo so classmates can recognize you. You can skip this for now.
                </p>
            </div>

            <div className="step-fields">
                <div
                    className={`upload-area ${data.previewUrl ? 'has-preview' : ''}`}
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                >
                    {data.previewUrl ? (
                        <>
                            <img
                                src={data.previewUrl}
                                alt="Avatar preview"
                                className="upload-preview"
                            />
                            <p className="text-sm text-accent">Click to change photo</p>
                        </>
                    ) : (
                        <>
                            <div className="upload-icon">📷</div>
                            <p className="upload-text">
                                Click to upload or drag and drop
                            </p>
                            <p className="upload-hint">
                                JPG, PNG or WebP — max 5 MB
                            </p>
                        </>
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFile(e.target.files?.[0])}
                />

                {data.previewUrl && (
                    <button
                        type="button"
                        className="btn-ghost"
                        onClick={handleRemove}
                        style={{ width: '100%' }}
                    >
                        Remove photo
                    </button>
                )}
            </div>
        </>
    );
}
