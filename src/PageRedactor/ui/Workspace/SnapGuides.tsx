import { Line } from 'react-konva';
import type { SnapGuide } from '../../hooks/interaction';

interface SnapGuidesProps {
    guides: SnapGuide[];
    stageWidth: number;
    stageHeight: number;
}

export function SnapGuides({ guides, stageWidth, stageHeight }: SnapGuidesProps) {
    if (guides.length === 0) return null;

    return (
        <>
            {guides.map((guide, index) => (
                <Line
                    key={`${guide.type}-${index}`}
                    points={
                        guide.type === 'vertical'
                            ? [guide.position, 0, guide.position, stageHeight]
                            : [0, guide.position, stageWidth, guide.position]
                    }
                    stroke="#2196F3"
                    strokeWidth={1}
                    dash={[4, 4]}
                    listening={false}
                />
            ))}
        </>
    );
}