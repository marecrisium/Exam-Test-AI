import React from 'react';

export const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
        <path d="M16.5 17.25C18.625 17.25 20.25 15.625 20.25 13.5C20.25 11.5 18.8 9.75 17 9.75H16.25C16 8 14.5 6.75 12.75 6.75C11.125 6.75 9.75 7.875 9.375 9.375H9C7.375 9.375 6 10.75 6 12.375C6 13.875 7.25 15.125 8.625 15.125" fill="#A3E635" />
        <path d="M12 9.75L12 16.5M12 9.75L10.125 11.625M12 9.75L13.875 11.625" stroke="#4D7C0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8.625 15.125C7.25 15.125 6 13.875 6 12.375C6 10.75 7.375 9.375 9 9.375H9.375C9.75 7.875 11.125 6.75 12.75 6.75C14.5 6.75 16 8 16.25 9.75H17C18.8 9.75 20.25 11.5 20.25 13.5C20.25 15.625 18.625 17.25 16.5 17.25" fill="url(#uploadGradient)" fillOpacity="0.6" />
        <defs>
            <linearGradient id="uploadGradient" x1="6" y1="12" x2="20.25" y2="12" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38BDF8" />
                <stop offset="1" stopColor="#0EA5E9" />
            </linearGradient>
        </defs>
    </svg>
);


export const XCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <defs>
            <linearGradient id="xCircleGradient" x1="21" y1="12" x2="3" y2="12" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F87171" />
                <stop offset="1" stopColor="#EF4444" />
            </linearGradient>
        </defs>
        <path fill="url(#xCircleGradient)" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path stroke="#FFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.25 9.75l-4.5 4.5m0-4.5l4.5 4.5" />
    </svg>
);

export const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <defs>
            <linearGradient id="sparkleGradient" x1="0" y1="0" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <linearGradient id="sparkleGradient2" x1="0" y1="0" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#0EA5E9" />
            </linearGradient>
        </defs>
        <path fill="url(#sparkleGradient)" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        <path fill="url(#sparkleGradient2)" d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
        <path fill="url(#sparkleGradient2)" d="M16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.455-2.456L12.75 18l1.178-.398a3.375 3.375 0 002.455-2.456L16.5 14.25l.398 1.178a3.375 3.375 0 002.456 2.456L20.25 18l-1.178.398a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
);


export const LoadingSpinnerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className={`animate-spin ${props.className}`}>
        <defs>
            <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
        </defs>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#94A3B8" strokeWidth="4"></circle>
        <path className="opacity-75" fill="url(#spinnerGradient)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <defs>
            <linearGradient id="downloadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
        </defs>
        <path stroke="url(#downloadGradient)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5" />
        <path fill="url(#downloadGradient)" d="M12 18a1.5 1.5 0 01-1.06-.44l-5-5a1.5 1.5 0 112.12-2.12L11.25 13.6V3.75a1.5 1.5 0 013 0v9.85l3.19-3.18a1.5 1.5 0 112.12 2.12l-5 5A1.5 1.5 0 0112 18z" />
    </svg>
);

export const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <defs>
            <linearGradient id="checkGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4ADE80" />
                <stop offset="100%" stopColor="#22C55E" />
            </linearGradient>
        </defs>
        <path stroke="url(#checkGradient)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

export const KeyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <defs>
            <linearGradient id="keyGradient" x1="2.25" y1="21.75" x2="21.75" y2="2.25" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FBBF24" />
                <stop offset="1" stopColor="#F59E0B" />
            </linearGradient>
        </defs>
        <path fill="url(#keyGradient)" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
);


export const QuestionMarkCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <defs>
            <linearGradient id="questionGradient" x1="21" y1="12" x2="3" y2="12" gradientUnits="userSpaceOnUse">
                <stop stopColor="#60A5FA" />
                <stop offset="1" stopColor="#3B82F6" />
            </linearGradient>
        </defs>
        <path fill="url(#questionGradient)" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path stroke="#FFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75" />
        <path fill="#FFF" d="M12.992 17.25a.992.992 0 11-1.984 0 .992.992 0 011.984 0z" />
    </svg>
);

export const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const PencilIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);