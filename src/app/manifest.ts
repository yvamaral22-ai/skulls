
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  const ICON_BASE64_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAYAAAA9z2YyAAAACXBIWXMAAAsTAAALEwEAmpwYAAADWklEQVR4nO3bXU4TYRSF4X0p0EAgMQQS/8SIAXFmDIIzI0ZnhmAnLomRREOQAA3eS6+FNDp9vWfOqTmnP9/I5ZzpL96mSeFwm6ZZ7/X96eH+7u8P8HCHt9PrX77X395Pr695K695Ky95K895u895v88Xv7z8f7e/vLz86+XfL/9e6fWy56XPy56Xfi99Xvq97Hnp99Lnpd/Ln5d+L31u8tzkuclzk+cmz02emzw3eW7y3OQR9hB2O4RdjtE8f7mY6u2Wst9lq7db+n6Xvd7N87D949Z4vS7H87mN87lZzuZqO5ubv78vM/mIun8uM20XU6Zp8pP+O8x6V5X5PmvzfXbm+5zZ77M13+fOfJ87+33u6v65vW3b/W37XW7bdv9eH7Y8bPmw5WHLw5Z7LQ9b7rU8bLnd8rDlXsu9lnstd1ruXf0E916Fey/CvRfh3otw70W49yLcexHuvQj3XoR7L8K9F+He09x7mnvX7t57lntvde9p7v099/6ue89279nuPdu9Z7v3bPee7d6z3bvGvWu8a9y7xr3GvWvca9y7xr1r3LvGvWu8m8y7ybvJvJu8m8y7ybvJvJu8m8y7ybuZ793M927mezd7vZu93s1e72avd7PXu9nrXfK9S753yfcu+d4l37vke5d875LvXfK9Lbzbwrs9vNvDu0W8W8S7Rbx7E+9+E+/+EO/+FO/+Hu/+Hu/v8P6R9/v83Ofv794C7y3C3iPs/SHeP8T7z7DfD7Lfo3Dfo3Dfo3DfFfbuCns3h7077N0f9m6Dvfuz7P5r9/f9S36fL/i9f83v/S3f8/v/mD/r0/mzf7W7/G63/S63+i63/S63+i63/S63+i6X9S6X9S6X9S6X9S6X9S6X9S6X9S6X9S6X9U5Z75T1TlkvP5f16vXy88t69Xp59brYy6vX9X1rL69e1/etvbz6un98N97v5/3O7+Z5v/PbvN79bv6p8XF9fP99m+79XF/fn+L6+u7+5/711e791P79FOf3f3D9/Y7v/3D/U/p/av8z9/6X7/0v3/uX7/0vX59vW/9vX59vW99vW69fL1/3X6+X9+p1fe/69Xp97/rX+/V+/Y7v/Uut77f97ze+v55fX/P3Cof68P+M/mU85+0+5/0+5/0+5/0+X/zy8v/Y7zLpXf8AZR3Gf8f/mY8AAAAASUVORK5CYII=";

  return {
    name: "Barbearia Skull's",
    short_name: "Barbearia Skull's",
    description: "Gestão Profissional para Barbearia Skull's",
    start_url: '/',
    display: 'standalone',
    background_color: '#050505',
    theme_color: '#facc15',
    icons: [
      {
        src: ICON_BASE64_PNG,
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: ICON_BASE64_PNG,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
    ],
  }
}
