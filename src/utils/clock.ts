export type Line<LogicalTime> = Event<LogicalTime>[];
export interface Event<LogicalTime> {
    name: string;
    time?: LogicalTime;
    causedBy?: string;
}

export abstract class LogicalClock<LogicalTime> {
    protected static STARTING_TIME_NAME = '_____';

    protected lines: Line<LogicalTime>[] = [];

    protected abstract getDefaultTime(nOfLines?: number): LogicalTime;
    protected abstract mergeTime(lineIndex: number, lineTime: LogicalTime, scatenanteTime: LogicalTime): LogicalTime;
    protected abstract increaseTime(lineIndex: number, lineTime: LogicalTime): LogicalTime;

    constructor(nOfLines = 3) {
        this.lines = Array(nOfLines).fill(0).map(() => [{
            name: LogicalClock.STARTING_TIME_NAME,
            time: this.getDefaultTime(nOfLines),
            causedBy: undefined
        }]);
    }

    get time(): Line<LogicalTime>[] {
        return this.lines.map(line => line.slice(1));
    }

    private get eventNames(): Set<string> {
        return new Set(this.lines.flatMap(line => line.map(event => event.name)));
    }

    private validateLineIndex(index: number): void {
        if (index < 0 || index >= this.lines.length) {
            throw new Error('LamportClock: Invalid line index');
        }
    }
    private validateNewEventName(eventName: string): void {
        if (this.eventNames.has(eventName)) {
            throw new Error('LamportClock: Event name already exists');
        }
    }
    public locateEvent(eventName: string): [number, number] | null {
        for (let lineIndex = 0; lineIndex < this.lines.length; lineIndex++) {
            const line = this.lines[lineIndex];
            const index = line.findIndex(event => event.name === eventName);
            if (index !== -1) {
                return [lineIndex, index];
            }
        }
        return null;
    }

    private reset(): void {
        for (const line of this.lines) {
            line.forEach((event, index) => {
                if (index !== 0) {
                    event.time = undefined;
                }
            });
        }
    }

    private resetCausedBy(eventNames: string[]) {
        for (const line of this.lines) {
            for (const event of line) {
                if (event.causedBy && eventNames.includes(event.causedBy)) {
                    event.causedBy = undefined;
                }
            }
        }
    }

    private adjustTime(): boolean {
        const currentLinesIndexes: number[] = Array(this.lines.length).fill(1);

        let progressMade: boolean;
        function advance(lineIndex: number): void {
            currentLinesIndexes[lineIndex]++;
            progressMade = true;
        }

        while (currentLinesIndexes.some((index, lineIndex) => index < this.lines[lineIndex].length)) {
            progressMade = false;
            this.lines.forEach((line, lineIndex) => {
                const currentIndex = currentLinesIndexes[lineIndex];
                if (currentIndex < line.length) {
                    const event = line[currentIndex];
                    const previousEvent = line[currentIndex - 1];

                    if (event.time === undefined && previousEvent.time !== undefined) {
                        if (event.causedBy === undefined) {
                            event.time = this.increaseTime(lineIndex, previousEvent.time);
                            advance(lineIndex);
                        }
                        else {
                            const [scatenanteLineIndex, scatenateEventIndex] = this.locateEvent(event.causedBy) as [number, number];
                            const eventoScatenante = this.lines[scatenanteLineIndex][scatenateEventIndex];

                            if (eventoScatenante.time != undefined) {
                                event.time = this.mergeTime(lineIndex, eventoScatenante.time, previousEvent.time);
                                advance(lineIndex);
                            }
                        }

                    }
                }
            });
            if (!progressMade) {
                return false;
            }
        }

        return true;
    }

    private apply(prepare: () => void): void {
        const backupLines = this.lines.map(line => line.map(event => ({ ...event })));
        prepare();
        this.reset();
        if (!this.adjustTime()) {
            this.lines = backupLines;
            throw new Error('Invalid system');
        }
    }

    public setStartingTime(lineIndex: number, startingTime: LogicalTime): void {
        this.apply(() => {
            this.validateLineIndex(lineIndex);
            const line = this.lines[lineIndex];
            line[0].time = startingTime;
        });
    }
    public addLine(startingTime?: LogicalTime): void {
        this.lines.push([{
            name: LogicalClock.STARTING_TIME_NAME,
            time: startingTime ?? this.getDefaultTime(),
            causedBy: undefined
        }]);
    }
    public removeLine(index?: number): void {
        this.apply(() => {
            index = index ?? this.lines.length - 1;
            this.validateLineIndex(index);
            this.resetCausedBy(this.lines[index].map(event => event.name));
            this.lines.splice(index, 1);
        });
    }

    public addRelation(from: string, to: string): void {
        this.apply(() => {
            const fromLocation = this.locateEvent(from);
            const toLocation = this.locateEvent(to);

            if (!fromLocation || !toLocation) {
                throw new Error('LamportClock: Event name does not exist');
            }
            if (fromLocation[0] === toLocation[0]) {
                throw new Error('LamportClock: Event names are in the same line');
            }

            const [lineIndex, eventIndex] = toLocation;
            this.lines[lineIndex][eventIndex].causedBy = from;
        });
    }
    public removeRelation(from: string, to: string): void {
        this.apply(() => {
            const fromLocation = this.locateEvent(from);
            const toLocation = this.locateEvent(to);

            if (!fromLocation || !toLocation) {
                throw new Error('LamportClock: Event name does not exist');
            }

            const [lineIndex, index] = toLocation;
            this.lines[lineIndex][index].causedBy = undefined;
        });
    }

    public addEvent(lineIndex: number, eventName: string): void {
        this.apply(() => {
            this.validateLineIndex(lineIndex);
            this.validateNewEventName(eventName);
            this.lines[lineIndex].push({
                name: eventName,
                time: undefined,
                causedBy: undefined
            });
        });
    }
    public removeEvent(eventName: string): void {
        this.apply(() => {
            this.lines = this.lines.map(line => line.filter(event => event.name !== eventName));
            this.resetCausedBy([eventName]);
        });
    }
}

export class VectorClock extends LogicalClock<number[]> {
    protected getDefaultTime(nOfLines?: number): number[] {
        return Array(nOfLines ?? this.lines.length).fill(0);
    }
    protected mergeTime(lineIndex: number, lineTime: number[], scatenanteTime: number[]): number[] {
        const result = scatenanteTime.map((time, index) => Math.max(time, lineTime[index]));
        result[lineIndex]++;
        return result;
    }
    protected increaseTime(lineIndex: number, lineTime: number[]): number[] {
        const result = [...lineTime];
        result[lineIndex]++;
        return result;
    }
}

export class LamportClock extends LogicalClock<number> {
    protected getDefaultTime(): number {
        return 0;
    }
    protected mergeTime(_lineIndex: number, lineTime: number, scatenanteTime: number): number {
        return Math.max(lineTime, scatenanteTime) + 1;
    }
    protected increaseTime(_lineIndex: number, lineTime: number): number {
       return lineTime + 1;
    }
}
