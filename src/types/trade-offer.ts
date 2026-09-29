export type TradeOfferDTO = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  wantedTradeSetId: string;
  wantedTradeSetName: string;
  wantedTcgId: string;
  wantedName: string;
  wantedNumber: string | null;
  wantedImageUrl: string | null;
  offeredTcgId: string;
  offeredName: string;
  offeredSetName: string;
  offeredSetCode: string | null;
  offeredNumber: string | null;
  offeredImageUrl: string | null;
  offeredLanguage: string;
  offeredRarity: string;
  visitorName: string | null;
  visitorNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

export type TradeOfferPayload = {
  wantedTradeSetId: string;
  wantedTcgId: string;
  offeredTcgId: string;
  offeredLanguage: string;
  visitorName?: string;
  visitorNote?: string;
};
