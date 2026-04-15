
export function SidebarSummary({ imageUrl }: { imageUrl: string }) {
    return <div style={{
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 100,
            width: 200,
            height: 150,
            background: 'white',
            border: '2px solid #ccc',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
            <img 
                src={imageUrl} 
                alt="Превью"
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    background: '#f5f5f5'
                }}
            />
            <div style={{
                position: 'absolute',
                bottom: 4,
                left: 0,
                right: 0,
                textAlign: 'center',
                fontSize: 10,
                color: '#666',
                background: 'rgba(255,255,255,0.8)'
            }}>
                Превью сцены
            </div>
    </div>
}
