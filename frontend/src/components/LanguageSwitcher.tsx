import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
    const { i18n, t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 text-foreground"
                title={t('common.switch_language')}
            >
                <Globe className="h-5 w-5" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-950 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-800 z-50">
                    <button
                        onClick={() => changeLanguage('zh')}
                        className={`block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm ${i18n.language === 'zh' ? 'bg-gray-50 dark:bg-gray-900 font-medium' : ''}`}
                    >
                        Chinese (中文)
                    </button>
                    <button
                        onClick={() => changeLanguage('en')}
                        className={`block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm ${i18n.language === 'en' ? 'bg-gray-50 dark:bg-gray-900 font-medium' : ''}`}
                    >
                        English (English)
                    </button>
                </div>
            )}
        </div>
    );
};
