interface SidebarToolsProps {
    selectedTool?: string;
    onToolChange?: (tool: string) => void;
}

export function SidebarTools({selectedTool = 'select', onToolChange }: SidebarToolsProps) {
    return <div style={{
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 100,
        background: 'white',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    }}>
        <button
            onClick={() => onToolChange?.('select')}
            style={{
                background: selectedTool === 'select' ? '#2196F3' : '#ddd',
                color: selectedTool === 'select' ? 'white' : 'black',
                cursor: 'pointer',
            }}
            title="Выделение (V)"
        >
            🖱️
        </button>
        <button
            onClick={() => onToolChange?.('pen')}
            style={{
                background: selectedTool === 'pen' ? '#2196F3' : '#ddd',
                color: selectedTool === 'pen' ? 'white' : 'black',
                cursor: 'pointer'
            }}
        >
            ✏️
        </button>
        <button
            onClick={() => onToolChange?.('eraser')}
            style={{
                background: selectedTool === 'eraser' ? '#2196F3' : '#ddd',
                color: selectedTool === 'eraser' ? 'white' : 'black',
                cursor: 'pointer'
            }}
        >
            🧽
        </button>
    </div>
}
