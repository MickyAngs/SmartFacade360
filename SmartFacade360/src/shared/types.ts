import z from "zod";

export const ArchitecturalStyleSchema = z.enum([
  'Minimalista',
  'Industrial', 
  'Clásico Mediterráneo',
  'Biofílico',
  'Contemporáneo',
  'Colonial',
  'Victoriano',
  'Moderno Escandinavo'
]);

export const MaterialSchema = z.enum([
  'Ladrillo Visto',
  'Hormigón Texturizado',
  'Madera Compuesta',
  'Vidrio',
  'Piedra Natural',
  'Metal Corten',
  'Fibrocemento',
  'Concreto Aparente'
]);

export const RoofTypeSchema = z.enum([
  'A Dos Aguas',
  'Plano',
  'Mansarda',
  'A Cuatro Aguas',
  'Shed',
  'Butterfly'
]);

export const WindowStyleSchema = z.enum([
  'Estándar',
  'Ventanal Completo',
  'Arco',
  'Bay Window',
  'Francesas',
  'Modernas Minimalistas'
]);

export const ExteriorFeatureSchema = z.enum([
  'Ninguna',
  'Balcón',
  'Terraza',
  'Porche',
  'Jardín Frontal',
  'Piscina',
  'Garaje Integrado'
]);

export const AccentColorSchema = z.object({
  name: z.string(),
  hex: z.string()
});

export const PropertyModelSchema = z.enum([
  'Casa Unifamiliar',
  'Apartamento Moderno',
  'Villa Mediterránea',
  'Loft Industrial',
  'Estudio Compacto',
  'Mansión',
  'Casa de Campo',
  'Duplex Moderno'
]);

export const FacadeDesignSchema = z.object({
  propertyModel: PropertyModelSchema,
  architecturalStyle: ArchitecturalStyleSchema,
  material: MaterialSchema,
  accentColor: AccentColorSchema,
  roofType: RoofTypeSchema.optional(),
  windowStyle: WindowStyleSchema.optional(),
  exteriorFeature: ExteriorFeatureSchema.optional()
});

export type ArchitecturalStyle = z.infer<typeof ArchitecturalStyleSchema>;
export type Material = z.infer<typeof MaterialSchema>;
export type RoofType = z.infer<typeof RoofTypeSchema>;
export type WindowStyle = z.infer<typeof WindowStyleSchema>;
export type ExteriorFeature = z.infer<typeof ExteriorFeatureSchema>;
export type AccentColor = z.infer<typeof AccentColorSchema>;
export type PropertyModel = z.infer<typeof PropertyModelSchema>;
export type FacadeDesign = z.infer<typeof FacadeDesignSchema>;

export const SceneObjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  position: z.array(z.number()).length(3),
  rotation: z.array(z.number()).length(3).optional(),
  scale: z.array(z.number()).length(3).optional()
});

export type SceneObject = z.infer<typeof SceneObjectSchema>;

export const UploadedModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  file: z.instanceof(File),
  url: z.string(),
  type: z.enum(['obj', 'glb', 'gltf', 'fbx', 'ifc', 'revit']),
  size: z.string(),
  status: z.enum(['uploading', 'ready', 'error']),
  position: z.array(z.number()).length(3),
  rotation: z.array(z.number()).length(3).optional(),
  scale: z.array(z.number()).length(3).optional()
});

export type UploadedModel = z.infer<typeof UploadedModelSchema>;
