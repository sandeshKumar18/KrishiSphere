import {
  ArrowRight,
  Check,
  Edit3,
  Leaf,
  MapPin,
  Plus,
  Ruler,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { api } from "../lib/api";

import "./Fields.css";

const getFieldId = (field) => {
  return (
    field?._id?.$oid ||
    field?._id ||
    field?.id ||
    field?.fieldId ||
    null
  );
};

const normalizeFields = (data) => {
  let fieldList = [];

  if (Array.isArray(data)) {
    fieldList = data;
  } else if (Array.isArray(data?.fields)) {
    fieldList = data.fields;
  } else if (Array.isArray(data?.data)) {
    fieldList = data.data;
  } else if (
    Array.isArray(data?.data?.fields)
  ) {
    fieldList = data.data.fields;
  }

  return fieldList.map((field) => ({
    ...field,
    _id: getFieldId(field)
      ? String(getFieldId(field))
      : undefined,
  }));
};

const Fields = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [deletingFieldId, setDeletingFieldId] = useState(null);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState(null);
  const isEditing = Boolean(editingFieldId);

  const [deleteCheckingFieldId, setDeleteCheckingFieldId] = useState(null);

  const [deleteCandidate, setDeleteCandidate] = useState(null);

  const [form, setForm] = useState({
    name: "",
    area: "",
    areaUnit: "acre",
    state: "",
    district: "",
    soilType: "",
  });

  const loadFields = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await api.get("/fields");

      const normalizedFields =
        normalizeFields(data);

      setFields(normalizedFields);
    } catch (err) {
      console.error(
        "Load fields error:",
        err
      );

      setError("fields.errorLoadFields");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFields();
  }, []);


  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleEditField = (field) => {
  const fieldId = getFieldId(field);

  if (!fieldId) {
    setError(
      "This field does not have a valid ID."
    );
    return;
  }

  setEditingFieldId(String(fieldId));

  setForm({
    name: field.name || "",
    area: field.area ?? "",
    areaUnit:
      field.areaUnit || "acre",
    state:
      field.location?.state || "",
    district:
      field.location?.district || "",
    soilType:
      field.soilType || "",
  });

  setShowAddForm(true);
  setError("");

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

  const resetForm = () => {
    setForm({
      name: "",
      area: "",
      areaUnit: "acre",
      state: "",
      district: "",
      soilType: "",
    });
  };

  const handleCloseForm = () => {
  if (submitting) return;

  resetForm();
  setEditingFieldId(null);
  setShowAddForm(false);
  setError("");
};

  const handleSubmit = async (event) => {
  event.preventDefault();

  try {
    setError("");

    const area = Number(form.area);

    if (!form.name.trim()) {
      setError(
        "Please enter a field name."
      );
      return;
    }

    if (!area || area <= 0) {
      setError(
        "Please enter a valid field area."
      );
      return;
    }

    if (!form.state.trim()) {
      setError(
        "Please enter the state."
      );
      return;
    }

    if (!form.district.trim()) {
      setError(
        "Please enter the district."
      );
      return;
    }

    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      area,
      areaUnit: form.areaUnit,
      location: {
        state: form.state.trim(),
        district:
          form.district.trim(),
      },
      soilType:
        form.soilType.trim(),
    };

    if (editingFieldId) {
      await api.patch(
        `/fields/${editingFieldId}`,
        payload
      );
    } else {
      await api.post(
        "/fields",
        payload
      );
    }

    resetForm();
    setEditingFieldId(null);
    setShowAddForm(false);

    await loadFields();
  } catch (err) {
    setError("fields.errorSaveField");

    setError(
      err.message ||
        "Failed to save field."
    );
  } finally {
    setSubmitting(false);
  }
};


  const filteredFields = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return fields;
    }

    return fields.filter((field) => {
      const name =
        field.name || "";

      const district =
        field.location?.district ||
        "";

      const state =
        field.location?.state ||
        "";

      const soilType =
        field.soilType || "";

      return (
        name.toLowerCase().includes(query) ||
        district
          .toLowerCase()
          .includes(query) ||
        state
          .toLowerCase()
          .includes(query) ||
        soilType
          .toLowerCase()
          .includes(query)
      );
    });
  }, [fields, search]);


  const stats = useMemo(() => {
    const unitTotals = {};

    fields.forEach((field) => {
      const unit =
        field.areaUnit || "acre";

      const area =
        Number(field.area) || 0;

      unitTotals[unit] =
        (unitTotals[unit] || 0) +
        area;
    });

    const areaSummary = Object.entries(unitTotals)
      .map(([unit, total]) => {
        const unitNameKeys = {
          acre: total === 1 ? "acreSingular" : "acrePlural",
          hectare: total === 1 ? "hectareSingular" : "hectarePlural",
          bigha: total === 1 ? "bighaSingular" : "bighaPlural",
        };

        const unitKey = unitNameKeys[unit];
        const unitLabel = unitKey
          ? t(`fields.${unitKey}`)
          : `${unit}${total !== 1 ? "s" : ""}`;

        return `${total.toFixed(2)} ${unitLabel}`;
      })
      .join(" · ");

    const districts =
      new Set(
        fields
          .map(
            (field) =>
              field.location?.district
          )
          .filter(Boolean)
          .map((district) =>
            district.toLowerCase()
          )
      );

    return {
      totalFields: fields.length,
      areaSummary:
        areaSummary || "—",
      districts: districts.size,
    };
  }, [fields,t]);


  const openField = (field) => {
    const fieldId = getFieldId(field);

    if (!fieldId) {
      setError(
        "This field does not have a valid ID."
      );
      return;
    }

    navigate(`/fields/${fieldId}`);
  };

 const handleDeleteField = async (field) => {
  const fieldId = getFieldId(field);

  if (!fieldId) {
    setError(
      "This field does not have a valid ID."
    );
    return;
  }

  try {
    setDeleteCheckingFieldId(
      String(fieldId)
    );

    setError("");

    const preview = await api.get(
      `/fields/${fieldId}/delete-preview`
    );

    const dependencies =
      preview?.dependencies || {};

    const hasData =
      preview?.hasData === true;


    if (!hasData) {
      setDeletingFieldId(
        String(fieldId)
      );

      await api.delete(
        `/fields/${fieldId}`
      );

      setFields((currentFields) =>
        currentFields.filter(
          (currentField) =>
            String(
              getFieldId(currentField)
            ) !== String(fieldId)
        )
      );

      return;
    }

    setDeleteCandidate({
      field,
      dependencies,
    });
  } catch (err) {
    console.error(
      "Delete field error:",
      err
    );

    setError("fields.errorDeleteField");
  } finally {
    setDeleteCheckingFieldId(null);
    setDeletingFieldId(null);
  }
};

const confirmDeleteField = async () => {
  if (!deleteCandidate) return;

  const field =
    deleteCandidate.field;

  const fieldId = getFieldId(field);

  if (!fieldId) return;

  try {
    setDeletingFieldId(
      String(fieldId)
    );

    setError("");

    await api.delete(
      `/fields/${fieldId}?force=true`
    );

    setFields((currentFields) =>
      currentFields.filter(
        (currentField) =>
          String(
            getFieldId(currentField)
          ) !== String(fieldId)
      )
    );

    setDeleteCandidate(null);
  } catch (err) {
    console.error(
      "Confirmed field deletion error:",
      err
    );

    setError("fields.errorDeleteField");
  } finally {
    setDeletingFieldId(null);
  }
};


  if (loading) {
    return (
      <div className="fields-page">

        <div className="fields-loading">

          <div className="fields-loading-heading">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-text" />
          </div>

          <div className="fields-loading-stats">
            <div className="skeleton skeleton-stat" />
            <div className="skeleton skeleton-stat" />
            <div className="skeleton skeleton-stat" />
          </div>

          <div className="skeleton skeleton-list" />
          <div className="skeleton skeleton-list" />

        </div>

      </div>
    );
  }

  return (
    <div className="fields-page">

      <section className="fields-header">

        <div>
          <div className="fields-eyebrow">
            <Leaf size={14} />
            {t("fields.farmManagement")}
          </div>

          <h1>
             {t("fields.title")}
          </h1>

          <p>{t("fields.headerDescription")}</p>
        </div>

        <button
          type="button"
          className="fields-add-button"
          onClick={() =>
            setShowAddForm(
              (current) => !current
            )
          }
        >
          {showAddForm ? (
            <>
              <X size={17} />
              {t("common.close")}
            </>
          ) : (
            <>
              <Plus size={17} />
              {t("fields.addField")}
            </>
          )}
        </button>

      </section>


      {error && (
        <div className="fields-error">

          <div className="fields-error-icon">
            !
          </div>

          <div>
            <strong>
              Something went wrong
            </strong>

            <p>{error ? t(error) : ""}</p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>

        </div>
      )}

      {showAddForm && (
        <section className="add-field-panel">

          <div className="add-field-heading">

            <div>
              <span>
                {isEditing
                    ? t("fields.editField")
                    : t("fields.newField")}
              </span>

              <h2>
                {isEditing
                   ? t("fields.updateYourField")
                   : t("fields.addYourFarmland")}
              </h2>

              <p>
                {isEditing
                  ? t("fields.editDescription")
                  : t("fields.addDescription")}
              </p>

              <p>
                Enter the basic details of
                this field. You can add
                soil test information later.
              </p>
            </div>

            <div className="add-field-icon">
              <Plus size={20} />
            </div>

          </div>


          <form
            className="field-form"
            onSubmit={handleSubmit}
          >

            <div className="field-form-group full">
              <label htmlFor="name">
               {t("fields.fieldName")}
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder={t("fields.fieldNamePlaceholder")}
                required
              />
            </div>


            <div className="field-form-group">
              <label htmlFor="area">
                 {t("fields.area")}
              </label>

              <div className="field-input-row">

                <input
                  id="area"
                  name="area"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.area}
                  onChange={handleChange}
                  placeholder={t("fields.areaPlaceholder")}
                  required
                />

                <select
                  name="areaUnit"
                  value={form.areaUnit}
                  onChange={handleChange}
                >
                  <option value="acre">
                    {t("fields.acre")}
                  </option>

                  <option value="hectare">
                    {t("fields.hectare")}
                  </option>

                  <option value="bigha">
                    {t("fields.bigha")}
                  </option>
                </select>

              </div>
            </div>


            <div className="field-form-group">
              <label htmlFor="soilType">
                {t("fields.soilType")}
                <span>{t("fields.optional")}</span>
              </label>

              <input
                id="soilType"
                name="soilType"
                type="text"
                value={form.soilType}
                onChange={handleChange}
                placeholder={t("fields.soilTypePlaceholder")}
              />
            </div>


            <div className="field-form-group">
              <label htmlFor="state">
                {t("fields.state")}
              </label>

              <input
                id="state"
                name="state"
                type="text"
                value={form.state}
                onChange={handleChange}
                 placeholder={t("fields.statePlaceholder")}
                required
              />
            </div>


            <div className="field-form-group">
              <label htmlFor="district">
                {t("fields.district")}
              </label>

              <input
                id="district"
                name="district"
                type="text"
                value={form.district}
                onChange={handleChange}
                placeholder={t("fields.districtPlaceholder")}
                required
              />
            </div>


            <div className="field-form-actions">

              <button
                type="button"
                className="field-cancel-button"
                onClick={handleCloseForm}
                disabled={submitting}
              >
                {t("common.cancel")}
              </button>

             <button
                type="submit"
                className="add-field-button"
                disabled={submitting}
              >
                {submitting
                  ? isEditing
                    ? t("fields.savingChanges")
                    : t("fields.addingField")
                  : isEditing
                    ? t("fields.saveChanges")
                    : t("fields.addField")}
              </button>

            </div>

          </form>

        </section>
      )}

      <section className="fields-stats">

        <div className="field-stat-card">

          <div className="field-stat-icon">
            <Leaf size={19} />
          </div>

          <div>
            <span>{t("fields.totalFields")}</span>

            <strong>
              {stats.totalFields}
            </strong>
          </div>

        </div>


        <div className="field-stat-card">

          <div className="field-stat-icon">
            <Ruler size={19} />
          </div>

          <div>
            <span>{t("fields.totalArea")}</span>

            <strong className="area-value">
              {stats.areaSummary}
            </strong>
          </div>

        </div>


        <div className="field-stat-card">

          <div className="field-stat-icon">
            <MapPin size={19} />
          </div>

          <div>
            <span>{t("fields.districtsCovered")}</span>

            <strong>
              {stats.districts}
            </strong>
          </div>

        </div>

      </section>


      <section className="fields-list-section">

        <div className="fields-list-header">

          <div>
            <span>
              {t("fields.yourFarmland")}
            </span>

            <h2>
               {t("fields.allFields")}
            </h2>
          </div>


          {fields.length > 0 && (
            <div className="fields-search">

              <Search size={16} />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder={t("fields.searchPlaceholder")}
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  aria-label={t("fields.clearSearch")}
                >
                  <X size={14} />
                </button>
              )}

            </div>
          )}

        </div>

        {fields.length === 0 ? (
          <div className="fields-empty">

            <div className="fields-empty-icon">
              <Leaf size={24} />
            </div>

            <h3>{t("fields.noFieldsYet")}</h3>

            <p>{t("fields.emptyDescription")}</p>

            <button
              type="button"
              onClick={() =>
                setShowAddForm(true)
              }
              className="fields-empty-button"
            >
              <Plus size={16} />
              {t("fields.addFirstField")}
            </button>

          </div>
        ) : filteredFields.length === 0 ? (
          <div className="fields-empty compact">

            <div className="fields-empty-icon">
              <Search size={22} />
            </div>

            <h3>{t("fields.noMatchingFields")}</h3>

            <p>{t("fields.noSearchResults")}</p>

          </div>
        ) : (
          <div className="field-list">

            {filteredFields.map(
              (field) => {
                const fieldId =
                  getFieldId(field);

                const location = [
                  field.location?.district,
                  field.location?.state,
                ]
                  .filter(Boolean)
                  .join(", ");

                return (
                  <article
                    key={
                      fieldId ||
                      field.name
                    }
                    className="field-item"
                  >

                    <div className="field-item-icon">
                      <Leaf size={21} />
                    </div>


                    <div className="field-item-main">

                      <div className="field-item-title">
                        <h3>
                          {field.name}
                        </h3>

                        <span>
                          Field
                        </span>
                      </div>

                      <div className="field-item-location">
                        <MapPin size={13} />
                        {location || t("fields.locationNotSet")}
                      </div>

                      <div className="field-item-meta">

                        <div>
                          <span>
                            Area
                          </span>

                          <strong>
                            {field.area ||
                              "—"}{" "}
                            {field.areaUnit ||
                              "acre"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Soil
                          </span>

                          <strong>
                            {field.soilType || t("fields.notSpecified")}
                          </strong>
                        </div>

                      </div>

                    </div>


            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <button
                type="button"
                className="field-open-button"
                onClick={() => openField(field)}
              >
                Open
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={() => handleDeleteField(field)}
                disabled={
                  deletingFieldId === String(fieldId)
                }
                title="Delete field"
                style={{
                  width: "40px",
                  height: "40px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #fecaca",
                  borderRadius: "10px",
                  background:
                    deletingFieldId === String(fieldId)
                      ? "#fef2f2"
                      : "#ffffff",
                  color: "#dc2626",
                  cursor:
                    deletingFieldId === String(fieldId)
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    deletingFieldId === String(fieldId)
                      ? 0.6
                      : 1,
                }}
              >
                <Trash2 size={16} />
              </button>

              <button
                type="button"
                className="field-edit-button"
                onClick={() =>
                  handleEditField(field)
                }
                title="Edit field"
              >
                <Edit3 size={16} />
              </button>
            </div>

                  </article>
                );
              }
            )}

          </div>
        )}

      </section>


      {fields.length > 0 && (
        <div className="fields-note">
          <Leaf size={15} />

          <span>
            {t("fields.fieldNote")}
          </span>
        </div>
      )}


      {deleteCandidate && (
  <div
    className="field-delete-overlay"
    onClick={() => {
      if (!deletingFieldId) {
        setDeleteCandidate(null);
      }
    }}
  >
    <div
      className="field-delete-modal"
      onClick={(event) =>
        event.stopPropagation()
      }
    >
      <div className="field-delete-icon">
        <AlertTriangle size={24} />
      </div>

      <div className="field-delete-content">
        <h3>{t("fields.deleteModalTitle")}</h3>

        <p>
          <strong>
            {deleteCandidate.field?.name ||
              t("fields.thisField")}
          </strong>{" "}
          {t("fields.deleteDescription")}
        </p>

        <div className="field-delete-data">
          {deleteCandidate.dependencies
            ?.soilTests > 0 && (
            <div className="field-delete-row">
              <span>{t("fields.soilTests")}</span>
              <strong>
                {
                  deleteCandidate
                    .dependencies
                    .soilTests
                }
              </strong>
            </div>
          )}

          {deleteCandidate.dependencies
            ?.recommendations > 0 && (
            <div className="field-delete-row">
              <span>{t("fields.recommendations")}</span>
              <strong>
                {
                  deleteCandidate
                    .dependencies
                    .recommendations
                }
              </strong>
            </div>
          )}

          {deleteCandidate.dependencies
            ?.cropCycles > 0 && (
            <div className="field-delete-row">
              <span>{t("fields.cropCycles")}</span>
              <strong>
                {
                  deleteCandidate
                    .dependencies
                    .cropCycles
                }
              </strong>
            </div>
          )}
        </div>

        <div className="field-delete-warning">
          {t("fields.deleteWarning")}
        </div>
      </div>

      <div className="field-delete-actions">
        <button
          type="button"
          className="field-delete-cancel"
          disabled={Boolean(
            deletingFieldId
          )}
          onClick={() =>
            setDeleteCandidate(null)
          }
        >
          {t("common.cancel")}
        </button>

        <button
          type="button"
          className="field-delete-confirm"
          disabled={Boolean(
            deletingFieldId
          )}
          onClick={confirmDeleteField}
        >
          <Trash2 size={16} />

          {deletingFieldId
            ? t("fields.deleting")
            : t("fields.deleteFieldAndData")}
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default Fields;