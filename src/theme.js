import { createTheme } from '@mui/material/styles';
export const makeTheme=mode=>createTheme({direction:'rtl',palette:{mode,primary:{main:'#0f766e'},secondary:{main:'#f59e0b'},background:{default:mode==='dark'?'#07111f':'#f4f7fb',paper:mode==='dark'?'#101c2c':'#fff'}},shape:{borderRadius:16},typography:{fontFamily:'Tahoma, Arial, sans-serif',h4:{fontWeight:800},h6:{fontWeight:700}},components:{MuiButton:{styleOverrides:{root:{borderRadius:12,fontWeight:700,textTransform:'none'},
 // المسافة بين الأيقونة والنص في RTL: الأيقونة على يمين النص، فتكون المسافة 8px على جهتها اليسرى.
 startIcon:({ownerState})=>({marginLeft:8,marginRight:ownerState.size==='small'?-2:-4}),endIcon:({ownerState})=>({marginRight:8,marginLeft:ownerState.size==='small'?-2:-4})}},
 // محاذاة RTL مركزية لعناصر MUI التي تفترض اتجاه LTR في أنماطها الافتراضية.
 MuiInputLabel:{styleOverrides:{root:{left:'auto',right:0,transformOrigin:'top right',textAlign:'right','&.MuiInputLabel-outlined':{transform:'translate(-14px, 16px) scale(1)'},'&.MuiInputLabel-outlined.MuiInputLabel-sizeSmall':{transform:'translate(-14px, 9px) scale(1)'},'&.MuiInputLabel-outlined.MuiInputLabel-shrink':{transform:'translate(-14px, -9px) scale(0.75)'}}}},
 MuiOutlinedInput:{styleOverrides:{notchedOutline:{textAlign:'right'}}},
 MuiInputBase:{styleOverrides:{input:{textAlign:'right','&[type=date]':{textAlign:'right'}}}},
 MuiSelect:{styleOverrides:{select:{'&&&':{paddingLeft:32,paddingRight:14},textAlign:'right'},icon:{right:'auto',left:7}}},
 MuiFormHelperText:{styleOverrides:{root:{textAlign:'right'}}},
 MuiFormControlLabel:{styleOverrides:{root:{marginLeft:16,marginRight:-11}}},
 MuiTableCell:{styleOverrides:{root:{textAlign:'right'}}},
 MuiDialogTitle:{styleOverrides:{root:{textAlign:'right'}}},
 MuiDialogContent:{styleOverrides:{root:{textAlign:'right'}}},
 MuiChip:{styleOverrides:{icon:{marginLeft:-6,marginRight:5}}},
 MuiAlert:{styleOverrides:{icon:{marginRight:0,marginLeft:12},action:{marginRight:'auto',marginLeft:-8,paddingLeft:0,paddingRight:16}}},
 MuiCard:{styleOverrides:{root:{border:'1px solid',borderColor:mode==='dark'?'#223047':'#e4eaf2',boxShadow:'0 12px 32px rgba(15,23,42,.07)'}}}}});
