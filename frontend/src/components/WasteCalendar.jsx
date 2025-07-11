import React from "react";

// Props:
// year: number (e.g. 2025)
// month: number (1-12)
// schedule: { [day: number]: fractionId[] }
// fractions: { id: number, name: string, color: string }[]
// onDayClick: (day: number) => void

const daysOfWeek = ["Po", "Wt", "Śr", "Cz", "Pt", "So", "Ni"];

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  // Returns 0 (Monday) to 6 (Sunday)
  const jsDay = new Date(year, month - 1, 1).getDay();
  return (jsDay + 6) % 7;
}

export default function WasteCalendar({ year, month, schedule, fractions, onDayClick }) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfWeek(year, month);

  // Build calendar grid (array of weeks, each week is array of days or null)
  const weeks = [];
  let week = Array(firstDayOfWeek).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  // Helper to get fraction objects for a day
  const getFractionsForDay = (day) => {
    const ids = schedule[day] || [];
    return fractions.filter(f => ids.includes(f.id));
  };

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, width: 440, minWidth: 440, overflowX: 'auto' }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          {daysOfWeek.map(d => (
            <div
              key={d}
              style={{
                flex: '0 0 60px',
                width: 60,
                minWidth: 60,
                maxWidth: 70,
                textAlign: "center",
                fontWeight: "bold"
              }}
            >
              {d}
            </div>
          ))}
        </div>
        {weeks.map((week, i) => (
          <div key={i} style={{ display: "flex" }}>
            {week.map((day, j) => (
              <div
                key={j}
                style={{
                  flex: '0 0 60px',
                  width: 60,
                  minWidth: 60,
                  maxWidth: 70,
                  height: 38,
                  border: "1px solid #eee",
                  textAlign: "center",
                  cursor: day ? "pointer" : "default",
                  background: day ? "#fff" : "#f9f9f9",
                  position: "relative"
                }}
                onClick={day ? () => onDayClick(day) : undefined}
              >
                {day && (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{day}</div>
                    <div style={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
                      {(() => {
                        const allFractions = getFractionsForDay(day);
                        const maxDots = 5;
                        const visibleFractions = allFractions.slice(0, maxDots);
                        const extraCount = allFractions.length - maxDots;
                        return (
                          <>
                            {visibleFractions.map(f => (
                              <span
                                key={f.id}
                                title={f.name}
                                style={{
                                  display: "inline-block",
                                  width: 10,
                                  height: 10,
                                  borderRadius: "50%",
                                  background: f.color,
                                  margin: "0 2px"
                                }}
                              />
                            ))}
                            {extraCount > 0 && (
                              <span
                                title={allFractions.map(f => f.name).join(", ")}
                                style={{ fontSize: 10, color: '#555', marginLeft: 2 }}
                              >
                                +{extraCount}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
} 