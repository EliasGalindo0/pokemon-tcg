export function CardBack() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_38%,#3c5874,#1b3348)]">
      <div className="relative h-16 w-16 rounded-full border-[3px] border-paper/90">
        <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-paper/90" />
        <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-paper/90 bg-[#1b3348]" />
      </div>
    </div>
  );
}
