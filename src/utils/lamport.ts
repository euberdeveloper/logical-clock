export type Line<LogicalTime> = Event<LogicalTime>[];
export interface Event<LogicalTime> {
    name: string;
    time?: LogicalTime;
    causedBy?: string;
}


export class LamportClock {
    private static STARTING_TIME_NAME = '_____';

    private lines: Line<number>[] = [];

    constructor(nOfLines = 3) {
        this.lines = Array(nOfLines).fill(0).map(() => [{
            name: LamportClock.STARTING_TIME_NAME,
            time: 0,
            causedBy: undefined
        }]);
    }

    private get eventNames(): Set<string> {
        return new Set(this.lines.flatMap(line => line.map(event => event.name)));
    }
    get time(): Line<number>[] {
        return this.lines.map(line => line.slice(1));
    }

    private mergeTime(lineTime: number, scatenanteTime: number): number {
        return Math.max(lineTime, scatenanteTime) + 1;
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
    private locateEvent(eventName: string): [number, number] | null {
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
                            event.time = (previousEvent.time) + 1;
                            advance(lineIndex);
                        }
                        else {
                            const [scatenanteLineIndex, scatenateEventIndex] = this.locateEvent(event.causedBy) as [number, number];
                            const eventoScatenante = this.lines[scatenanteLineIndex][scatenateEventIndex];

                            if (eventoScatenante.time != undefined) {
                                event.time = this.mergeTime(eventoScatenante.time, previousEvent.time);
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

    public setStartingTime(lineIndex: number, startingTime: number): void {
        this.apply(() => {
            this.validateLineIndex(lineIndex);
            const line = this.lines[lineIndex];
            line[0].time = startingTime;
        });
    }
    public addLine(startingTime = 0): void {
        this.lines.push([{
            name: LamportClock.STARTING_TIME_NAME,
            time: startingTime,
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