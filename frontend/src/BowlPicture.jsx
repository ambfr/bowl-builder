import { swatchFor } from "./palette";

// A piece of topping, drawn at the origin and moved/rotated by the caller.
function Piece({ name, color }) {
  if (name === "Banana")
    return (
      <g>
        <circle r="11" fill={color} stroke="#d2b965" strokeWidth="1.5" />
        <circle r="3" fill="#d2b965" />
      </g>
    );
  if (name === "Strawberry")
    return (
      <g>
        <ellipse rx="8" ry="11" fill={color} />
        <circle cx="-2" cy="-3" r="1.6" fill="#f6b3bd" />
        <circle cx="2.5" cy="2" r="1.4" fill="#f6b3bd" />
      </g>
    );
  if (name === "Granola")
    return <rect x="-8" y="-4" width="16" height="8" rx="3" fill={color} />;
  return <circle r="8" fill={color} />;
}

const PIECES = 8;

export default function BowlPicture({ base, toppings, drizzles, size }) {
  const scale = size === "SMALL" ? 0.84 : size === "LARGE" ? 1 : 0.92;

  return (
    <div className="mx-auto w-full max-w-md" style={{ transform: "scale(" + scale + ")", transition: "transform 0.4s ease" }}>
      <svg viewBox="0 0 400 400" role="img" aria-label="Your bowl, seen from above">
        <defs>
          <clipPath id="bowl-inside">
            <circle cx="200" cy="200" r="142" />
          </clipPath>
        </defs>

        <circle cx="200" cy="200" r="192" fill="#ffffff" />
        <circle cx="200" cy="200" r="160" fill="#ece4f0" />
        <circle cx="200" cy="200" r="150" fill="#f8f5fa" />
        <circle
          cx="200"
          cy="200"
          r="142"
          fill={base ? swatchFor(base.name) : "#e4dbe9"}
          style={{ transition: "fill 0.4s ease" }}
        />

        <g clipPath="url(#bowl-inside)">
          {/* soft highlight so the surface does not look flat */}
          <ellipse cx="150" cy="140" rx="90" ry="55" fill="#ffffff" opacity="0.08" />

          {toppings.map((t, idx) =>
            Array.from({ length: PIECES }, (_, k) => {
              const angle = k * 2.4 + idx * 1.3;
              const radius = 30 + ((k * 37 + idx * 53) % 78);
              const x = 200 + Math.cos(angle) * radius;
              const y = 200 + Math.sin(angle) * radius;
              const rot = (k * 47 + idx * 29) % 180;
              return (
                <g key={t.id + "-" + k} transform={"translate(" + x + " " + y + ") rotate(" + rot + ")"}>
                  <Piece name={t.name} color={swatchFor(t.name)} />
                </g>
              );
            })
          )}

          {drizzles.map((d, idx) => {
            const y = 150 + idx * 48;
            return (
              <path
                key={d.id}
                d={"M40 " + y + " Q 100 " + (y - 50) + " 160 " + y + " T 280 " + y + " T 400 " + y}
                fill="none"
                stroke={swatchFor(d.name)}
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.9"
              />
            );
          })}
        </g>

        {!base && (
          <text
            x="200"
            y="207"
            textAnchor="middle"
            fill="#7a2b66"
            opacity="0.6"
            style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 22 }}
          >
            Choose a base
          </text>
        )}
      </svg>
    </div>
  );
}