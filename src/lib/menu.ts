export type ProteinKey = "carne" | "pollo" | "cerdo" | "veggie";

export type Protein = {
  key: ProteinKey;
  label: string;
  description: string;
  /** URL de la foto del producto. Vacío = se muestra placeholder. */
  imageUrl?: string;
};

export const proteins: Protein[] = [
  {
    key: "carne",
    label: "Carne",
    description: "Tira de asado desmechada con BBQ casera.",
    imageUrl: "/menu/carne.png",
  },
  {
    key: "pollo",
    label: "Pollo",
    description: "Pollo deshebrado a la BBQ, jugoso.",
    imageUrl: "/menu/pollo.png",
  },
  {
    key: "cerdo",
    label: "Cerdo",
    description: "Pulled pork ahumado, glaseado con miel.",
    imageUrl: "/menu/cerdo.png",
  },
  {
    key: "veggie",
    label: "Veggie",
    description: "Hongos y vegetales asados, salsa coleslaw.",
    imageUrl: "/menu/veggie.png",
  },
];

export const comboIncludes = [
  "200g de proteína a elección",
  "4 figacitas de manteca",
  "Cebolla caramelizada y repollo",
  "4 salsas: BBQ, mostaza-miel, coleslaw, mayonesa",
];
