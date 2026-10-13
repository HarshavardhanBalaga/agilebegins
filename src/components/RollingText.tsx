type RollingTextProps = {
  text: string;
  /** Extra classes for the duplicate face (e.g. accent color). Defaults to inheriting. */
  backClassName?: string;
};

/**
 * Roll-up "cube face" text: on link hover the visible copy rolls upward to
 * reveal an identical copy below, like one face of a cube turning over.
 */
export default function RollingText({ text, backClassName }: RollingTextProps) {
  return (
    <span aria-label={text} className="cube-roll">
      <span aria-hidden="true" className="cube-roll-inner">
        <span className="cube-roll-face">{text}</span>
        <span className={`cube-roll-face ${backClassName ?? ""}`}>{text}</span>
      </span>
    </span>
  );
}
