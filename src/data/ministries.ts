export type MinistryLayout = "logo" | "photos";

export const DEFAULT_MINISTRY_LAYOUT: MinistryLayout = "logo";

export type MinistryItem = {
  id: string;
  title: string;
  image: string;
  photo: string;
  description: string;
  keepBackground: boolean;
};

export const DEFAULT_MINISTRIES: MinistryItem[] = [
  {
    id: "corazon-inquieto",
    title: "Corazón Inquieto",
    image: "/images/logo-corazon-inquieto.webp",
    photo: "",
    description: "",
    keepBackground: false,
  },
  {
    id: "angelus",
    title: "Angelus",
    image: "",
    photo: "",
    description: "",
    keepBackground: false,
  },
  {
    id: "proyecto-catolico",
    title: "Proyecto Católico",
    image: "/images/logo-proyecto-catolico.webp",
    photo: "",
    description: "",
    keepBackground: true,
  },
  {
    id: "pro-deo",
    title: "Ministerio Pro Deo",
    image: "/images/logo-pro-deo.webp",
    photo: "",
    description: "",
    keepBackground: true,
  },
];
