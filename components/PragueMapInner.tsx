"use client";

import {
  useEffect,
} from "react";

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import {
  divIcon,
  latLngBounds,
} from "leaflet";

import type {
  Place,
} from "@/data/places";

import type {
  PragueMapProps,
} from "@/components/PragueMap";

const PRAGUE_CENTER: [
  number,
  number,
] = [
  50.0755,
  14.4378,
];

function escapeHtml(
  value: string
) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createPlaceIcon(
  place: Place,
  selected: boolean
) {
  const background =
    selected
      ? "#0057FF"
      : "#102B45";

  const border =
    selected
      ? "#FFFFFF"
      : place.partner
        ? "#8EC5FF"
        : "rgba(87,144,255,0.55)";

  const size =
    selected ? 48 : 42;

  return divIcon({
    className: "",

    html: `
      <div
        style="
          width:${size}px;
          height:${size}px;
          display:flex;
          align-items:center;
          justify-content:center;
          border-radius:9999px;
          background:${background};
          border:2px solid ${border};
          box-shadow:0 8px 24px rgba(0,0,0,0.35);
          font-size:${selected ? 20 : 18}px;
          transition:all 0.2s ease;
        "
      >
        ${escapeHtml(place.symbol)}
      </div>
    `,

    iconSize: [
      size,
      size,
    ],

    iconAnchor: [
      size / 2,
      size / 2,
    ],

    popupAnchor: [
      0,
      -(size / 2),
    ],
  });
}

function MapController({
  places,
  selectedPlace,
}: {
  places: Place[];
  selectedPlace: Place | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedPlace) {
      map.flyTo(
        [
          selectedPlace.latitude,
          selectedPlace.longitude,
        ],
        15,
        {
          duration: 0.7,
        }
      );

      return;
    }

    if (places.length > 0) {
      const bounds =
        latLngBounds(
          places.map(
            (place) =>
              [
                place.latitude,
                place.longitude,
              ] as [
                number,
                number,
              ]
          )
        );

      map.fitBounds(
        bounds,
        {
          padding: [
            50,
            50,
          ],

          maxZoom: 14,
        }
      );

      return;
    }

    map.setView(
      PRAGUE_CENTER,
      12
    );
  }, [
    map,
    places,
    selectedPlace,
  ]);

  return null;
}

export default function PragueMapInner({
  placesToShow,
  selectedPlace,
  onSelect,
  compact = false,
}: PragueMapProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-[24px] border border-white/10 bg-[#091A2A] ${
        compact
          ? "h-[340px]"
          : "h-[560px]"
      }`}
    >
      <MapContainer
        center={
          PRAGUE_CENTER
        }
        zoom={12}
        minZoom={10}
        maxZoom={19}
        scrollWheelZoom={
          false
        }
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController
          places={
            placesToShow
          }
          selectedPlace={
            selectedPlace
          }
        />

        {placesToShow.map(
          (place) => {
            const selected =
              selectedPlace
                ?.name ===
              place.name;

            return (
              <Marker
                key={
                  place.name
                }
                position={[
                  place.latitude,
                  place.longitude,
                ]}
                icon={createPlaceIcon(
                  place,
                  selected
                )}
                eventHandlers={{
                  click: () =>
                    onSelect(
                      place
                    ),
                }}
              >
                <Popup>
                  <div
                    style={{
                      minWidth:
                        "180px",
                    }}
                  >
                    <strong>
                      {
                        place.name
                      }
                    </strong>

                    <div
                      style={{
                        marginTop:
                          "4px",
                      }}
                    >
                      {
                        place.area
                      }
                    </div>

                    <div
                      style={{
                        marginTop:
                          "5px",
                        opacity:
                          0.7,
                      }}
                    >
                      {
                        place.address
                      }
                    </div>

                    {place.partner && (
                      <div
                        style={{
                          marginTop:
                            "8px",
                          fontWeight:
                            600,
                        }}
                      >
                        BBA Club Perk
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          }
        )}
      </MapContainer>
    </div>
  );
}