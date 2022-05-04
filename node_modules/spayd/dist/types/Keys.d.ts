declare abstract class Key {
    protected name: string;
    protected structure: RegExp | null;
    protected value: string;
    constructor(name: string, value: string, structure?: RegExp);
    isValid(): boolean;
    toString(): string;
}
export declare class Acc extends Key {
    constructor(value: string);
    isValid(): boolean;
}
export declare class AltAcc extends Key {
    constructor(value: string[]);
    isValid(): boolean;
}
export declare class Am extends Key {
    constructor(value: string);
}
export declare class Cc extends Key {
    constructor(value: string);
}
export declare class Rf extends Key {
    constructor(value: string);
}
export declare class Rn extends Key {
    constructor(value: string);
}
export declare class Dt extends Key {
    private originalDate;
    constructor(value: Date);
    isValid(): boolean;
}
export declare class Pt extends Key {
    constructor(value: string);
}
export declare class Msg extends Key {
    constructor(value: string);
}
export declare class Crc32 extends Key {
    constructor(value: string);
}
export declare class Xper extends Key {
    constructor(value: string);
}
export declare class Xvs extends Key {
    constructor(value: string);
}
export declare class Xss extends Key {
    constructor(value: string);
}
export declare class Xks extends Key {
    constructor(value: string);
}
export declare class Xid extends Key {
    constructor(value: string);
}
export declare const keyMap: {
    acc: typeof Acc;
    altAcc: typeof AltAcc;
    am: typeof Am;
    cc: typeof Cc;
    rf: typeof Rf;
    rn: typeof Rn;
    dt: typeof Dt;
    pt: typeof Pt;
    msg: typeof Msg;
    crc32: typeof Crc32;
    xper: typeof Xper;
    xvs: typeof Xvs;
    xss: typeof Xss;
    xks: typeof Xks;
    xid: typeof Xid;
};
export {};
